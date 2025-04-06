import { createCanvas, loadImage } from "canvas";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Function to generate a pattern based on input data
function generatePattern(data: string, gridRows: number, gridCols: number): { filled: boolean; sizeFactor: number }[][] {
  const hash = ethers.id(data); // Generate a keccak256 hash of the data
  const bytes = ethers.getBytes(hash);
  const pattern: { filled: boolean; sizeFactor: number }[][] = Array(gridRows)
    .fill(null)
    .map(() => Array(gridCols).fill({ filled: false, sizeFactor: 1.0 }));

  // Use the hash to determine which cells are filled and their size factors
  for (let i = 0; i < gridRows * gridCols; i++) {
    const byte = bytes[i % bytes.length];
    const sizeByte = bytes[(i + 1) % bytes.length]; // Use the next byte for size
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    pattern[row][col] = {
      filled: (byte % 2) === 0, // True for even, False for odd
      sizeFactor: 0.5 + (sizeByte % 128) / 255, // Scale between 0.5 and 1.0
    };
  }

  return pattern;
}

// Function to determine the shape color based on rarity
function getShapeColor(rarity: string): string {
  switch (rarity) {
    case "Legendary":
      return "rgb(91, 222, 255)"; // Yellow
    case "Epic":
      return "rgb(252, 211, 31)"; // Purple
    case "Rare":
      return "rgb(133, 133, 133)"; // Green
    case "Uncommon":
      return "rgb(221, 149, 41)"; // Blue
    case "Common":
    default:
      return "rgb(63, 63, 63)"; // Grey
  }
}

// Export the generatePatternImage function
export async function generatePatternImage(
  quizId: string,
  walletAddress: string,
  timestamp: string,
  rarity: string,
  outputPath: string
): Promise<void> {
  // Update canvas size to 4500x4500
  const canvas = createCanvas(4500, 4500);
  const ctx = canvas.getContext("2d");

  try {
    // Verify rarity is valid
    const validRarities = ["Legendary", "Epic", "Rare", "Uncommon", "Common"];
    if (!validRarities.includes(rarity)) {
      throw new Error(`Invalid rarity: ${rarity}`);
    }

    // Load background
    const backImagePath = path.join(process.cwd(), "src", "img", "WhiteBack.png");
    if (!fs.existsSync(backImagePath)) {
      throw new Error("Background image not found: WhiteBack.png");
    }
    const backImage = await loadImage(backImagePath);
    ctx.drawImage(backImage, 0, 0, 4500, 4500);

    // Scale up the shapes layer dimensions proportionally
    const shapesSize = 4500; // Scaled up from 950
    const shapesOffsetX = (4500 - shapesSize) / 2 - 5; // Adjusted for new canvas size
    const shapesOffsetY = (4500 - shapesSize) / 2 - 5; // Adjusted for new canvas size

    // Define the center of the shapes layer for rotation
    const shapesCenterX = shapesOffsetX + shapesSize / 2;
    const shapesCenterY = shapesOffsetY + shapesSize / 2;

    // Define section dimensions within the shapes layer
    const sectionHeight = shapesSize / 3;
    const gridRows = 7;
    const gridCols = 17;
    const cellWidth = shapesSize / gridCols;
    const cellHeight = sectionHeight / gridRows;

    // Define the shape color based on rarity
    const shapeColor = getShapeColor(rarity);

    // Generate patterns for each section
    const quizPattern = generatePattern(quizId, gridRows, gridCols);
    const walletPattern = generatePattern(walletAddress, gridRows, gridCols);
    const timePattern = generatePattern(timestamp, gridRows, gridCols);

    // Save the canvas state before applying transformations
    ctx.save();

    // Apply rotation around the center of the shapes layer
    ctx.translate(shapesCenterX, shapesCenterY);
    //ctx.rotate(-6 * (Math.PI / 180)); // -6 degrees in radians
    ctx.translate(-shapesCenterX, -shapesCenterY);

    // Draw the triangle pattern (top section)
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (quizPattern[row][col].filled) {
          const sizeFactor = quizPattern[row][col].sizeFactor;
          ctx.fillStyle = shapeColor;
          ctx.beginPath();
          const x = shapesOffsetX + col * cellWidth;
          const y = shapesOffsetY + row * cellHeight;
          const halfWidth = (cellWidth / 2) * sizeFactor;
          const fullHeight = cellHeight * sizeFactor;
          ctx.moveTo(x + cellWidth / 2, y); // Top vertex
          ctx.lineTo(x + (cellWidth / 2) - halfWidth, y + fullHeight); // Bottom-left vertex
          ctx.lineTo(x + (cellWidth / 2) + halfWidth, y + fullHeight); // Bottom-right vertex
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw the square pattern (middle section)
    ctx.globalAlpha = 0.25; // Set 25% opacity for middle layer
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (walletPattern[row][col].filled) {
          const sizeFactor = walletPattern[row][col].sizeFactor;
          ctx.fillStyle = shapeColor;
          const x = shapesOffsetX + col * cellWidth;
          const y = shapesOffsetY + sectionHeight + row * cellHeight;
          const squareWidth = cellWidth * sizeFactor;
          const squareHeight = cellHeight * sizeFactor;
          const offsetX = (cellWidth - squareWidth) / 2;
          const offsetY = (cellHeight - squareHeight) / 2;
          ctx.fillRect(x + offsetX, y + offsetY, squareWidth, squareHeight);
        }
      }
    }
    ctx.globalAlpha = 1.0; // Reset opacity for subsequent layers

    // Draw the circle pattern (bottom section)
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (timePattern[row][col].filled) {
          const sizeFactor = timePattern[row][col].sizeFactor;
          ctx.fillStyle = shapeColor;
          const x = shapesOffsetX + col * cellWidth + cellWidth / 2;
          const y = shapesOffsetY + 2 * sectionHeight + row * cellHeight + cellHeight / 2;
          const maxRadius = Math.min(cellWidth, cellHeight) / 2 - 2;
          const radius = maxRadius * sizeFactor;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Restore the canvas state to remove the rotation for the foreground layer
    ctx.restore();

    // Load and draw the rarity-specific foreground
    const foregroundFileName = `${rarity}.png`;
    const frontImagePath = path.join(process.cwd(), "src", "img", foregroundFileName);
    if (!fs.existsSync(frontImagePath)) {
      throw new Error(`Foreground image not found: ${foregroundFileName}`);
    }
    const frontImage = await loadImage(frontImagePath);
    ctx.drawImage(frontImage, 0, 0, 4500, 4500);

    // Save the final image
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Image generated and saved as ${outputPath} with rarity ${rarity}`);
  } catch (error) {
    console.error("Error generating pattern image:", error);
    throw error;
  }
}