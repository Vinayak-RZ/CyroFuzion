import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "./components/Auth/SignUp"; 
import LoginPage from "./components/Auth/Login";
import Home from "./components/Home/Home";
import AuctionPage from "./components/Auction/price";
import SwapPage from "./components/Swap/swap";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auction" element={<AuctionPage auctionId={1} />} />
        <Route path="/swap" element={<SwapPage />} />
      </Routes>
    </Router>
  );
};

export default App;
