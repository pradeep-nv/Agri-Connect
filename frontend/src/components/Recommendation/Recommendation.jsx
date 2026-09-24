import React, { useState } from 'react';
import './Recommendation.scss';
import newRequest from '../../utils/newRequest.js';

const Recommendation = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState('general');

    // General AI State
    const [climate, setClimate] = useState('');
    const [soilType, setSoilType] = useState('');
    const [cropType, setCropType] = useState('');
    const [cropInfo, setCropInfo] = useState('');
    const [weatherDetails, setWeatherDetails] = useState('');
    const [cropConditions, setCropConditions] = useState('');
    const [recommendation, setRecommendation] = useState([]);
    const [error, setError] = useState('');
    const [loading, setloading] = useState(false);
    const [showOutput, setShowOutput] = useState(false); // visibility

    // Algorithmic State
    const [nVal, setNVal] = useState('');
    const [pVal, setPVal] = useState('');
    const [kVal, setKVal] = useState('');
    const [phVal, setPhVal] = useState('');
    const [rainVal, setRainVal] = useState('');
    const [algoPrediction, setAlgoPrediction] = useState('');
    const [algoFertilizer, setAlgoFertilizer] = useState('');
    const [tempVal, setTempVal] = useState('');
    const [humiVal, setHumiVal] = useState('');
    const [moistVal, setMoistVal] = useState('');
    const [algoLoading, setAlgoLoading] = useState(false);

    // Function to clean markdown symbols
    const cleanMarkdown = (text) => {
        // Remove markdown syntax for headers (##) and bold (**) or italic (*) symbols
        return text
            .replace(/(\*\*|\*|##)/g, '')  // Remove all asterisks (*) and headers (##)
            .trim();
    };

    // Here we are fetching the recommendation
    const fetchRecommendation = async () => {
        setloading(true);
        setError('');

        try {
            const response = await newRequest.post('/api/recommendations', {
                climate,
                soilType,
                cropType,
                cropInfo,
                weatherDetails,
                cropConditions,
            }, { withCredentials: true });

            // Here splitting any empty strings and cleaning up markdown symbols
            const recommendationsArray = response.data.recommendation
                .split('\n')
                .filter(item => item.trim() !== '')
                .map(item => cleanMarkdown(item)); // Clean each item

            setRecommendation(recommendationsArray);
            setShowOutput(true);
        } catch (err) {
            setError("Failed to fetch recommendations");
        } finally {
            setloading(false);
        }
    };

    const fetchAlgoRecommendation = async () => {
        setAlgoLoading(true);
        setError('');
        try {
            const response = await newRequest.post('/api/algorithmic-recommendation', {
                N: nVal,
                P: pVal,
                K: kVal,
                ph: phVal,
                rain: rainVal,
                temp: tempVal,
                humi: humiVal,
                moist: moistVal
            });
            setAlgoPrediction(response.data.prediction);
            setAlgoFertilizer(response.data.fertilizer);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch algorithmic recommendation");
        } finally {
            setAlgoLoading(false);
        }
    };

    const toggleOutputVisibility = () => {
        setShowOutput(!showOutput);
    };

    return (
        <div className='recommendations'>
            <h2>Crop Recommendations</h2>

            <div className="tabs">
                <button
                    className={activeTab === 'general' ? 'active' : ''}
                    onClick={() => setActiveTab('general')}
                >
                    General Advice (AI)
                </button>
                <button
                    className={activeTab === 'algorithmic' ? 'active' : ''}
                    onClick={() => setActiveTab('algorithmic')}
                >
                    Precision Predictor (Algorithm)
                </button>
            </div>

            {activeTab === 'general' ? (
                <>
                    {/* Showing the input fields if the output field is hidden */}
                    {!showOutput && (
                        <>
                            <div className="input-group">
                                <label>Climate : </label>
                                <input
                                    type="text"
                                    value={climate}
                                    onChange={(e) => setClimate(e.target.value)}
                                    placeholder='e.g., tropical, temperate'
                                />
                            </div>
                            <div className="input-group">
                                <label>Soil Type : </label>
                                <input
                                    type="text"
                                    value={soilType}
                                    onChange={(e) => setSoilType(e.target.value)}
                                    placeholder="e.g., loamy, clay, sandy"
                                />
                            </div>

                            <div className="input-group">
                                <label>Crop Type : </label>
                                <input
                                    type="text"
                                    value={cropType}
                                    onChange={(e) => setCropType(e.target.value)}
                                    placeholder="e.g., rice, wheat"
                                />
                            </div>

                            <div className="input-group">
                                <label>Crop Info : </label>
                                <input
                                    type="text"
                                    value={cropInfo}
                                    onChange={(e) => setCropInfo(e.target.value)}
                                    placeholder="e.g., high yield, drought-resistant"
                                />
                            </div>

                            <div className="input-group">
                                <label>Today's Weather : </label>
                                <input
                                    type="text"
                                    value={weatherDetails}
                                    onChange={(e) => setWeatherDetails(e.target.value)}
                                    placeholder="e.g., sunny with a high of 30°C"
                                />
                            </div>

                            <div className="input-group">
                                <label>Crop Conditions : </label>
                                <input
                                    type="text"
                                    value={cropConditions}
                                    onChange={(e) => setCropConditions(e.target.value)}
                                    placeholder="e.g., well-irrigated"
                                />
                            </div>
                            <button onClick={fetchRecommendation}>Get Recommendations</button>
                        </>
                    )}

                    {/* If loading showing the loading indicator */}
                    {loading && <div className='loading'>Loading...</div>}

                    {showOutput && recommendation.length > 0 && (
                        <div className="result">
                            <h3>Farming Recommendations for today : </h3>
                            <div className="recommendation-section">
                                <h4>{`Farming Recommendation for your ${cropType} field : `}</h4>
                                <p><strong>Today's Focus:</strong> Maintaining healthy growth and preparing for the upcoming harvest.</p>
                                <h5>Suitable Farming Practices:</h5>
                                <ul>
                                    {recommendation.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                                <h5>Precautions : </h5>
                                <p>Start planning for your harvest and monitor for signs of pests and diseases.</p>
                            </div>
                        </div>
                    )}

                    {error && <p className='error'>{error}</p>}

                    {/* Button to toggle the visibility */}
                    {recommendation.length > 0 && (
                        <button onClick={toggleOutputVisibility}>{showOutput ? 'Back to Input' : 'View recommendations'}</button>
                    )}
                </>
            ) : (
                // Algorithmic Section
                <div className="algorithmic-section">
                    <p style={{ marginBottom: '15px' }}>Enter soil parameters to get a machine-learning based crop recommendation (Random Forest Algorithm).</p>
                    <div className="input-group">
                        <label>Nitrogen (N) : </label>
                        <input
                            type="number"
                            value={nVal}
                            onChange={(e) => setNVal(e.target.value)}
                            placeholder="e.g. 90"
                        />
                    </div>
                    <div className="input-group">
                        <label>Phosphorus (P) : </label>
                        <input
                            type="number"
                            value={pVal}
                            onChange={(e) => setPVal(e.target.value)}
                            placeholder="e.g. 42"
                        />
                    </div>
                    <div className="input-group">
                        <label>Potassium (K) : </label>
                        <input
                            type="number"
                            value={kVal}
                            onChange={(e) => setKVal(e.target.value)}
                            placeholder="e.g. 43"
                        />
                    </div>
                    <div className="input-group">
                        <label>Temperature (°C) : </label>
                        <input
                            type="number"
                            value={tempVal}
                            onChange={(e) => setTempVal(e.target.value)}
                            placeholder="e.g. 26"
                        />
                    </div>
                    <div className="input-group">
                        <label>Humidity (%) : </label>
                        <input
                            type="number"
                            value={humiVal}
                            onChange={(e) => setHumiVal(e.target.value)}
                            placeholder="e.g. 52"
                        />
                    </div>
                    <div className="input-group">
                        <label>Moisture Content : </label>
                        <input
                            type="number"
                            value={moistVal}
                            onChange={(e) => setMoistVal(e.target.value)}
                            placeholder="e.g. 38"
                        />
                    </div>

                    <button onClick={fetchAlgoRecommendation}>Predict Crop & Fertilizer</button>

                    {algoLoading && <div className='loading'>Calculating...</div>}

                    {algoPrediction && (
                        <div className="result">
                            <h3>Machine Learning Results:</h3>
                            <div className="recommendation-section">
                                <div style={{ display: 'flex', justifyContent: 'space-around', margin: '15px 0' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#666', fontSize: '14px' }}>Recommended Crop</p>
                                        <h4 style={{ fontSize: '24px', color: '#2ecc71' }}>{algoPrediction.toUpperCase()}</h4>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#666', fontSize: '14px' }}>Suggested Fertilizer</p>
                                        <h4 style={{ fontSize: '24px', color: '#3498db' }}>{algoFertilizer}</h4>
                                    </div>
                                </div>
                                <p style={{ textAlign: 'center', marginTop: '10px' }}>
                                    Based on your Nitrogen, Phosphorus, Potassium, and environmental levels,
                                    the Random Forest algorithm analyzed 8,000+ records to provide these results.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Recommendation;
