{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE OverloadedStrings #-}

module Fusion.OnChain where

import           Plutus.V2.Ledger.Api
import           Plutus.V2.Ledger.Contexts
import           PlutusTx                      (BuiltinData, compile, makeIsDataIndexed, makeLift)
import qualified PlutusTx
import           Prelude                       (Bool (..), Eq, (&&), ($), traceError, traceIfFalse, Show, Integer, (>=))
import           GHC.Generics                  (Generic)
import           Data.Aeson                    (ToJSON, FromJSON)

------------------------------------------------------------------------------------------
-- Datum and Redeemer Types
------------------------------------------------------------------------------------------

data FusionDatum = FusionDatum
    { fdMaker         :: PubKeyHash
    , fdResolver      :: PubKeyHash
    , fdToken         :: AssetClass
    , fdAmount        :: Integer
    , fdHashlock      :: BuiltinByteString
    , fdSafetyDeposit :: Integer
    }

    deriving stock (Generic, Show)
    deriving anyclass (ToJSON, FromJSON)

PlutusTx.makeIsDataIndexed ''FusionDatum [('FusionDatum, 0)]
PlutusTx.makeLift ''FusionDatum

data FusionRedeemer = RevealSecret BuiltinByteString
                    | CancelOrder
    deriving stock (Generic, Show)
    deriving anyclass (ToJSON, FromJSON)

PlutusTx.makeIsDataIndexed ''FusionRedeemer [('RevealSecret, 0), ('CancelOrder, 1)]
PlutusTx.makeLift ''FusionRedeemer

------------------------------------------------------------------------------------------
-- Constants
------------------------------------------------------------------------------------------

{-# INLINABLE timelockA #-}
timelockA :: POSIXTime
timelockA = 20000

{-# INLINABLE timelockB #-}
timelockB :: POSIXTime
timelockB = 10000

------------------------------------------------------------------------------------------
-- Main Validator Logic
------------------------------------------------------------------------------------------

{-# INLINABLE mkValidator #-}
mkValidator :: FusionDatum -> FusionRedeemer -> ScriptContext -> Bool
mkValidator datum redeemer ctx =
    case redeemer of
        RevealSecret secret ->
            traceIfFalse "Not signed by resolver" signedByResolver &&
            traceIfFalse "Secret does not match hashlock" validSecret &&
            traceIfFalse "TimelockB not reached" timelockBReached &&

        CancelOrder ->
            traceIfFalse "TimelockA not reached" timelockAReached &&
            traceIfFalse "Safety deposit not paid to resolver" safetyDepositReturned &&
            traceIfFalse "Locked tokens not returned to maker" tokenReturnedToMaker

  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    signedByResolver :: Bool
    signedByResolver = txSignedBy info (fdResolver datum)

    validSecret :: Bool
    validSecret = sha2_256 secret == fdHashlock datum

    now :: POSIXTime
    now = case ivFrom (txInfoValidRange info) of
             LowerBound (Finite t) _ -> t
             _                       -> traceError "Invalid time range"

    timelockAReached :: Bool
    timelockAReached = now >= timelockA

    timelockBReached :: Bool
    timelockBReached = now >= timelockB

    safetyDepositReturned :: Bool
    safetyDepositReturned =
        let expected = lovelaceValueOf (fdSafetyDeposit datum)
        in paidTo (fdResolver datum) expected

    tokenReturnedToMaker :: Bool
    tokenReturnedToMaker =
        let expected = assetClassValue (fdToken datum) (fdAmount datum)
        in paidTo (fdMaker datum) expected

--    tokenPaidToTaker :: Bool
--  tokenPaidToTaker =
--      let expected = assetClassValue (fdToken datum) (fdAmount datum)
--      in paidTo (fdTaker datum) expected

    -- Reusable helper
    paidTo :: PubKeyHash -> Value -> Bool
    paidTo pkh expected =
        any (\o -> txOutAddress o == pubKeyHashAddress pkh && txOutValue o `geq` expected) (txInfoOutputs info)

------------------------------------------------------------------------------------------
-- Boilerplate
------------------------------------------------------------------------------------------

{-# INLINABLE wrappedValidator #-}
wrappedValidator :: BuiltinData -> BuiltinData -> BuiltinData -> ()
wrappedValidator = wrapValidator mkValidator

validator :: Validator
validator = mkValidatorScript $$(compile [|| wrappedValidator ||])

validatorHash :: ValidatorHash
validatorHash = validatorHash validator

scriptAddress :: Address
scriptAddress = scriptHashAddress validatorHash

------------------------------------------------------------------------------------------
-- Utility
------------------------------------------------------------------------------------------

{-# INLINABLE pubKeyHashAddress #-}
pubKeyHashAddress :: PubKeyHash -> Address
pubKeyHashAddress pkh = Address (PubKeyCredential pkh) Nothing
