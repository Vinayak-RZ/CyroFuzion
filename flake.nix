{
  description = "Plutus Smart Contract Project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";

    #  Pin using query string instead of separate `rev`
  plutus.url = "github:input-output-hk/plutus?rev=32e7df1197a1141c93bb1806474c561466ab1392";
  };

  outputs = { self, nixpkgs, flake-utils, plutus, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = if plutus ? overlays then plutus.overlays else [];
        };

        plutusPackages = plutus.packages.${system};
      in {
        devShell = pkgs.mkShell {
          name = "plutus-dev-shell";

          nativeBuildInputs = with pkgs; [
            haskellPackages.ghc
            haskellPackages.cabal-install
            haskellPackages.haskell-language-server
            haskellPackages.hlint
            haskellPackages.stylish-haskell
            ghcid
            git
            jq
            curl
            niv
            lzma
          ];

          shellHook = ''
            echo " Welcome to the Plutus development shell!"
          '';
        };
      });
}
