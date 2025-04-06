"use client";
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface Word {
  text: string;
  size: number;
}

interface D3CloudWord extends Word {
  x: number;
  y: number;
  rotate: number;
  font: string;
}

interface WordCloudProps {
  words: Word[];
  width?: number;
  height?: number;
}

export default function WordCloud({ words, width = 600, height = 400 }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Return early if no container or words
    if (!containerRef.current || !words.length) return;

    // Store ref in a variable at the start of the effect
    const container = containerRef.current;
    const colors = ['#00c7df', '#ced661', '#e5e7eb'];

    d3.select(container).selectAll("*").remove();

    const maxSize = Math.max(...words.map(w => w.size));
    const minSize = Math.min(...words.map(w => w.size));
    const sizeScale = d3.scaleLinear()
      .domain([minSize || 1, maxSize || 10])
      .range([16, 50]);

    const layout = cloud<Word>()
      .size([width * 0.95, height * 0.95])
      .padding(10)
      .spiral("rectangular")
      .rotate(() => 0)
      .font("Inter")
      .fontSize(d => sizeScale(d.size))
      .words(words)
      .on("end", (words) => draw(words as D3CloudWord[], container));

    layout.start();

    function draw(words: D3CloudWord[], container: HTMLDivElement) {
      const svg = d3.select(container)
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
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .text(d => d.text);

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

    // Use captured container variable in cleanup
    return () => {
      if (container) {
        d3.select(container).selectAll("*").remove();
      }
    };
  }, [words, width, height]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}