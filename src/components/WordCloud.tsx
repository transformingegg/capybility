"use client";
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface Word {
  text: string;
  size: number;
}

interface WordCloudProps {
  words: Word[];
  width?: number;
  height?: number;
}

export default function WordCloud({ words, width = 600, height = 400 }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !words.length) return;

    // Clear previous content
    d3.select(containerRef.current).selectAll("*").remove();

    // Define your specific colors
    const colors = ['#00c7df', '#ced661', '#e5e7eb']; // Blue, Yellow, Light Grey

    // Normalize sizes to a reasonable range
    const maxSize = Math.max(...words.map(w => w.size));
    const minSize = Math.min(...words.map(w => w.size));
    const sizeScale = d3.scaleLinear()
      .domain([minSize || 1, maxSize || 10])
      .range([16, 50]); // Reduced maximum font size, increased minimum

    const cloudWords = words.map(d => ({ text: d.text, size: d.size }));

    const layout = cloud()
      .size([width * 0.95, height * 0.95]) // Increased available space
      .padding(10) // Increased padding between words
      .spiral("rectangular") // Changed to rectangular spiral for better spacing
      .rotate(() => 0)
      .font("Inter")
      .fontSize(d => sizeScale(d.size ?? 1))
      .words(cloudWords)
      .on("end", draw);

    layout.start();

    function draw(words: Array<{ text: string; size: number; x: number; y: number; rotate: number; font: string }>) {
      const svg = d3.select(containerRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const text = g.selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", d => `${d.size}px`)
        .style("font-family", "Inter, Arial, sans-serif")
        .style("fill", (_, i) => colors[i % colors.length])
        .style("font-weight", "600")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.05)")
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y})`) // Removed rotation
        .text(d => d.text);

      // Add hover effect
      text
        .on("mouseover", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill-opacity", 0.7)
            .style("cursor", "pointer");
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .style("fill-opacity", 1);
        });
    }

    return () => {
      d3.select(containerRef.current).selectAll("*").remove();
    };
  }, [words, width, height]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        background: '#ffffff', // Changed to white background
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}