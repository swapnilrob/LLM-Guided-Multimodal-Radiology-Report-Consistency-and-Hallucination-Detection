# LLM-Guided Multimodal Radiology Report Consistency and Hallucination Detection

A web application that detects hallucinations and consistency violations in
AI-generated or manually written chest X-ray radiology reports by cross-checking
extracted clinical claims against the source image using multimodal LLM reasoning.

## Project Structure
- `client/` — React frontend
- `server/` — Node.js/Express backend API
- `ai-service/` — Python FastAPI service for AI model calls (claim extraction,
  hallucination detection, consistency checking)

## Author
