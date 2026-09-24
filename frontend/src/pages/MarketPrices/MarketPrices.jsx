import React, { useState, useEffect } from 'react';
import './MarketPrices.scss';
import Sidebar from '../../components/sidebar/Sidebar.jsx';
import BackToHome from '../../components/backToHome/BackToHome.jsx';
import newRequest from '../../utils/newRequest.js';
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SyncIcon from "@mui/icons-material/Sync";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { toast } from 'react-toastify';
import CircularProgress from '@mui/material/CircularProgress';

const MarketPrices = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [searchDistrict, setSearchDistrict] = useState("");
    const [searchCommodity, setSearchCommodity] = useState("");

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const query = [];
            if (searchDistrict) query.push(`district=${searchDistrict}`);
            if (searchCommodity) query.push(`commodity=${searchCommodity}`);
            const queryString = query.length > 0 ? `?${query.join('&')}` : '';

            const res = await newRequest.get(`/api/market-prices${queryString}`);
            setPrices(res.data);
        } catch (err) {
            console.error("Error fetching market prices:", err);
            toast.error("Failed to fetch market prices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPrices();
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await newRequest.get('/api/market-prices/sync');
            toast.success(`Successfully synced ${res.data.count} latest market prices!`);
            fetchPrices(); // Refresh data after sync
        } catch (err) {
            console.error("Error syncing prices:", err);
            const errorMessage = err.response?.data?.error || "Failed to sync market prices.";
            toast.error(errorMessage);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="market-prices-container">
            <div className="left">
                <Sidebar />
            </div>
            <div className="right">
                <div className="top">
                    <BackToHome />
                </div>
                <div className="bottom">
                    <div className="market-header">
                        <div className="title">
                            <TrendingUpIcon className="header-icon" />
                            <h2>Karnataka Live Market Prices</h2>
                        </div>
                        <button 
                            className="sync-btn" 
                            onClick={handleSync} 
                            disabled={syncing}
                        >
                            {syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                            <span>{syncing ? "Syncing..." : "Sync Latest Data"}</span>
                        </button>
                    </div>

                    <div className="filters-container">
                        <form onSubmit={handleSearch} className="search-form">
                            <div className="input-group">
                                <SearchIcon className="icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search by District (e.g. Kolar)" 
                                    value={searchDistrict}
                                    onChange={(e) => setSearchDistrict(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <FilterAltIcon className="icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Crop (e.g. Tomato)" 
                                    value={searchCommodity}
                                    onChange={(e) => setSearchCommodity(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="search-btn">Search</button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <CircularProgress />
                            <p>Loading latest market rates...</p>
                        </div>
                    ) : prices.length === 0 ? (
                        <div className="empty-state">
                            <StorefrontIcon className="empty-icon" />
                            <h3>No Market Prices Found</h3>
                            <p>Try syncing the latest data or adjusting your search filters.</p>
                        </div>
                    ) : (
                        <div className="prices-grid">
                            {prices.map((price, index) => (
                                <div className="price-card" key={index}>
                                    <div className="card-header">
                                        <span className="market-name">{price.market} ({price.district})</span>
                                        <span className="date">{price.arrivalDate || new Date().toLocaleDateString('en-GB')}</span>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="commodity">{price.commodity}</h3>
                                        <p className="variety">Variety: {price.variety || 'Standard'}</p>
                                        
                                        <div className="price-details">
                                            <div className="price-box modal-price">
                                                <span className="label">Modal Price (Avg)</span>
                                                <span className="value">₹{price.modalPrice} / Qtl</span>
                                            </div>
                                            <div className="min-max">
                                                <div className="price-box">
                                                    <span className="label">Min Price</span>
                                                    <span className="value">₹{price.minPrice}</span>
                                                </div>
                                                <div className="price-box">
                                                    <span className="label">Max Price</span>
                                                    <span className="value">₹{price.maxPrice}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketPrices;
