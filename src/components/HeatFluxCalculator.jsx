import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const calculateHeatFlux = (flowRate, heatContent, radFraction, distance) => {
  // Calculate total heat release in kW
  const btuPerMin = flowRate * heatContent;
  const btuPerDay = btuPerMin * 1440;  // convert to BTU/day
  const kwhPerDay = btuPerDay / 3412;  // convert to kWh/day using 1 kWh = 3412 BTU
  const kW = kwhPerDay / 24;           // convert to kW
  
  // Calculate radiative heat flux at distance
  return (radFraction * kW) / (4 * Math.PI * Math.pow(distance, 2));
};

export const HeatFluxCalculator = () => {
  const [flowRate, setFlowRate] = useState(150); // scfm
  const [heatContent, setHeatContent] = useState(650); // BTU/scf
  const [radFraction, setRadFraction] = useState(0.35); // 35% radiation fraction

  const handleFlowRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFlowRate(value);
    }
  };

  const handleHeatContentChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setHeatContent(value);
    }
  };

  const handleRadFractionChange = (e) => {
    const value = parseFloat(e.target.value) / 100; // Convert from percentage to decimal
    if (!isNaN(value) && value > 0 && value <= 1) {
      setRadFraction(value);
    }
  };

  // Calculate total heat release
  const totalHeatKw = useMemo(() => {
    const btuPerMin = flowRate * heatContent;
    const btuPerDay = btuPerMin * 1440;
    const kwhPerDay = btuPerDay / 3412;
    return kwhPerDay / 24;
  }, [flowRate, heatContent]);

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i + 1);
    return distances.map(distance => ({
      distance,
      heatFlux: calculateHeatFlux(flowRate, heatContent, radFraction, distance),
      safeLimit: 1.5,
      shortExposureLimit: 3.0,
      veryShortExposureLimit: 4.6,
    }));
  }, [flowRate, heatContent, radFraction]);

  const keyDistances = useMemo(() => {
    const findDistance = (targetFlux) => {
      const heatRelease = totalHeatKw;
      const distance = Math.sqrt((radFraction * heatRelease) / (4 * Math.PI * targetFlux));
      return Math.round(distance * 10) / 10;
    };

    return {
      safe: findDistance(1.5),
      shortExposure: findDistance(3.0),
      veryShortExposure: findDistance(4.6),
    };
  }, [totalHeatKw, radFraction]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Biogas Flare Heat Flux Calculator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="flowRate">
              Flow Rate (SCFM)
            </label>
            <input
              id="flowRate"
              type="number"
              value={flowRate}
              onChange={handleFlowRateChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="heatContent">
              Heat Content (BTU/SCF)
            </label>
            <input
              id="heatContent"
              type="number"
              value={heatContent}
              onChange={handleHeatContentChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="radFraction">
              Radiation Fraction (%)
            </label>
            <input
              id="radFraction"
              type="number"
              value={radFraction * 100}
              onChange={handleRadFractionChange}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Calculation Results</h3>
          <div className="bg-gray-50 p-4 rounded-md space-y-2 font-mono text-sm">
            <p>BTU/min = {flowRate} SCFM × {heatContent} BTU/SCF = {flowRate * heatContent}</p>
            <p>BTU/day = {flowRate * heatContent} × 1440 = {(flowRate * heatContent * 1440).toLocaleString()}</p>
            <p>kWh/day = {(flowRate * heatContent * 1440).toLocaleString()} ÷ 3412 = {((flowRate * heatContent * 1440)/3412).toLocaleString()}</p>
            <p>kW = {((flowRate * heatContent * 1440)/3412).toLocaleString()} ÷ 24 = {totalHeatKw.toLocaleString()}</p>
          </div>
        </div>

        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="distance" 
                label={{ value: 'Distance (m)', position: 'bottom', offset: 0 }}
                domain={[1, 100]}
              />
              <YAxis 
                label={{ value: 'Heat Flux (kW/m²)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="heatFlux" 
                stroke="#8884d8" 
                name="Heat Flux"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="safeLimit" 
                stroke="#82ca9d" 
                strokeDasharray="5 5" 
                name="Safe Limit (1.5 kW/m²)"
              />
              <Line 
                type="monotone" 
                dataKey="shortExposureLimit" 
                stroke="#ffc658" 
                strokeDasharray="5 5" 
                name="Short Exposure (3.0 kW/m²)"
              />
              <Line 
                type="monotone" 
                dataKey="veryShortExposureLimit" 
                stroke="#ff7300" 
                strokeDasharray="5 5" 
                name="Very Short Exposure (4.6 kW/m²)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold mb-2">Required Safety Distances:</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Safe Working Distance (1.5 kW/m²): {keyDistances.safe}m</li>
            <li>Short Exposure Limit (~48s) (3.0 kW/m²): {keyDistances.shortExposure}m</li>
            <li>Very Short Exposure Limit (~45s) (4.6 kW/m²): {keyDistances.veryShortExposure}m</li>
          </ul>
          <p className="mt-4 text-red-600 text-sm">
            Note: Specialized protective equipment required for closer approaches or longer durations.
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">References & Notes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Safety Thresholds:</h4>
              <p className="italic border-l-2 border-gray-200 pl-4 mt-1">
                "To determine safe working conditions in emergency situations at petro-chemical plants in the Netherlands a study was performed on three protective clothing combinations (operator's, fire-fighter's and aluminized). The clothing was evaluated at four different heat radiation levels (3.0, 4.6, 6.3 and 10.0 k·W·m⁻²) in standing and walking posture with a thermal manikin RadMan™. Time till pain threshold (43°C) is set as a cut-off criterion for regular activities."
              </p>
              <p className="text-xs mt-1">Source: Heus & Denhartog (2017). Industrial Health, 55, 529-536.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
