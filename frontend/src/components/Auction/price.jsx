import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './price.css';

const AuctionPage = ({ auctionId = "12345" }) => {
    const chartRef = useRef(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);

    // Add global styles to ensure full coverage
    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.background = 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        return () => {
            // Cleanup styles when component unmounts
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.background = '';
            document.documentElement.style.margin = '';
            document.documentElement.style.padding = '';
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Replace with actual API call
                const data = [
                    { timestamp: new Date('2025-08-01T10:00:00'), price: 1.2 },
                    { timestamp: new Date('2025-08-01T10:05:00'), price: 1.5 },
                    { timestamp: new Date('2025-08-01T10:10:00'), price: 1.3 },
                    { timestamp: new Date('2025-08-01T10:15:00'), price: 1.6 },
                    { timestamp: new Date('2025-08-01T10:20:00'), price: 1.8 },
                    { timestamp: new Date('2025-08-01T10:25:00'), price: 1.4 },
                    { timestamp: new Date('2025-08-01T10:30:00'), price: 2.1 },
                    { timestamp: new Date('2025-08-01T10:35:00'), price: 2.3 },
                ];
                setChartData(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load chart data.');
                setLoading(false);
            }
        };
        if (auctionId) fetchData();
    }, [auctionId]);

    useEffect(() => {
        if (chartRef.current && chartData) drawChart(chartData);
    }, [chartData]);

    const drawChart = (data) => {
        d3.select(chartRef.current).selectAll('*').remove();
        
        const margin = { top: 60, right: 60, bottom: 60, left: 80 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select(chartRef.current)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const defs = svg.append('defs');
        
        // Gradients
        const lineGradient = defs.append('linearGradient').attr('id', 'lineGrad');
        lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#4f46e5');
        lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa');

        const areaGradient = defs.append('linearGradient').attr('id', 'areaGrad').attr('x2', '0%').attr('y2', '100%');
        areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#4f46e5').attr('stop-opacity', 0.3);
        areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#4f46e5').attr('stop-opacity', 0);

        const titleGradient = defs.append('linearGradient').attr('id', 'titleGradient');
        titleGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
        titleGradient.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa');

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime().domain(d3.extent(data, d => d.timestamp)).range([0, width]);
        const y = d3.scaleLinear().domain([d3.min(data, d => d.price) * 0.9, d3.max(data, d => d.price) * 1.1]).range([height, 0]);

        // Grid
        g.append('g').attr('class', 'grid')
            .call(d3.axisLeft(y).tickSize(-width).tickFormat('').ticks(5));
        g.append('g').attr('class', 'grid').attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(-height).tickFormat('').ticks(6));

        // Area
        const area = d3.area().x(d => x(d.timestamp)).y0(height).y1(d => y(d.price)).curve(d3.curveCatmullRom);
        g.append('path').datum(data).attr('class', 'price-area')
            .attr('fill', 'url(#areaGrad)').attr('d', area);

        // Line
        const line = d3.line().x(d => x(d.timestamp)).y(d => y(d.price)).curve(d3.curveCatmullRom);
        const path = g.append('path').datum(data).attr('class', 'price-line')
            .attr('stroke', 'url(#lineGrad)').attr('d', line);

        // Animate line
        const totalLength = path.node().getTotalLength();
        path.attr('stroke-dasharray', totalLength).attr('stroke-dashoffset', totalLength)
            .transition().duration(1500).attr('stroke-dashoffset', 0);

        // Points
        const circles = g.selectAll('circle').data(data).enter().append('circle').attr('class', 'data-point')
            .attr('cx', d => x(d.timestamp)).attr('cy', d => y(d.price)).attr('r', 0);

        circles.transition().delay((d, i) => i * 150 + 800).duration(200).attr('r', 4);

        // Hover effects
        circles.on('mouseover', function(event, d) {
            d3.select(this).transition().duration(150).attr('r', 7);
            
            const tooltip = g.append('g').attr('class', 'auction-tooltip')
                .attr('transform', `translate(${x(d.timestamp)},${y(d.price)})`);
            tooltip.append('rect').attr('x', -35).attr('y', -35).attr('width', 70).attr('height', 25).attr('rx', 6);
            tooltip.append('text').attr('class', 'tooltip-time').attr('y', -25)
                .text(d3.timeFormat('%H:%M')(d.timestamp));
            tooltip.append('text').attr('class', 'tooltip-price').attr('y', -15)
                .text(`$${d.price.toFixed(2)}`);
        }).on('mouseout', function() {
            d3.select(this).transition().duration(150).attr('r', 4);
            g.selectAll('.auction-tooltip').remove();
        });

        // Axes
        g.append('g').attr('class', 'axis').attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%H:%M')));
        g.append('g').attr('class', 'axis')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d.toFixed(2)}`));

        // Title
        svg.append('text').attr('class', 'auction-title')
            .attr('x', (width + margin.left + margin.right) / 2).attr('y', 30)
            .text(`Auction #${auctionId} Price Trend`);

        // Current price indicator
        const currentPrice = data[data.length - 1].price;
        const indicator = svg.append('g').attr('class', 'current-price-indicator')
            .attr('transform', `translate(${width + margin.left - 100}, 50)`);
        indicator.append('rect').attr('width', 90).attr('height', 40).attr('rx', 8);
        indicator.append('text').attr('class', 'price-label')
            .attr('x', 45).attr('y', 15).text('CURRENT');
        indicator.append('text').attr('class', 'price-value')
            .attr('x', 45).attr('y', 30).text(`$${currentPrice.toFixed(2)}`);
    };

    if (loading) {
        return (
            <div className="auction-container">
                <div className="auction-loading">
                    <div className="auction-loading-spinner"></div>
                    <span className="auction-loading-text">Loading chart...</span>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="auction-container">
                <div className="auction-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="auction-container">
            <div className="auction-chart-wrapper">
                <div ref={chartRef} className="auction-chart" />
            </div>
        </div>
    );
};

export default AuctionPage;