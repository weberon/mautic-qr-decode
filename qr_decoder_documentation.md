# QR Code Decoder Documentation

## Table of Contents
1. [User Guide](#user-guide)
   - [Introduction](#introduction)
   - [Getting Started](#getting-started)
   - [Using the App](#using-the-app)
   - [Understanding the Results](#understanding-the-results)
   - [Troubleshooting](#troubleshooting)
2. [Developer Guide](#developer-guide)
   - [Project Overview](#project-overview)
   - [Setup and Installation](#setup-and-installation)
   - [Code Structure](#code-structure)
   - [Key Components](#key-components)
   - [Data Flow](#data-flow)
   - [Error Handling](#error-handling)
   - [Customization and Extension](#customization-and-extension)

## User Guide

### Introduction
The QR Code Decoder is a web application that allows users to scan QR codes containing URLs. It's particularly designed to handle URLs with a special 'ct' parameter that contains serialized data.

### Getting Started
1. Open the application in a web browser on a device with a camera.
2. Grant camera permissions when prompted.

### Using the App
1. Click the "Start Scanning" button to activate the QR code scanner.
2. Point your device's camera at a QR code.
3. Once a QR code is detected, the app will automatically process it.

### Understanding the Results
After scanning, you'll see:
- **Host**: The domain of the scanned URL.
- **Lead ID**: If available, extracted from the deserialized 'ct' parameter.
- **Details**: Click to expand for more information:
  - **Deserialized Data**: Parsed content of the 'ct' parameter.
  - **Path**: The URL path.
  - **URL Parameters**: All query parameters in the URL.
  - **Full URL**: The complete scanned URL.

### Troubleshooting
- If the camera doesn't activate, ensure you've granted the necessary permissions.
- If a QR code isn't recognized, try adjusting the distance or angle.
- For errors in processing the 'ct' parameter, check the Details section for specific error messages.

## Developer Guide

### Project Overview
This React application uses the `qr-scanner` library to decode QR codes. It's designed to handle URLs with a special 'ct' parameter containing base64 encoded, PHP serialized data.

### Setup and Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Use `npm start` to run the development server.

### Code Structure
- `App.js`: Main component containing the core logic.
- `App.css`: Styles for the application.
- `phpUnserialize`: Function to deserialize PHP serialized data.

### Key Components
1. **QR Scanner**:
   - Utilizes `qr-scanner` library.
   - Configured in the `startScanner` function.

2. **URL Processing**:
   - Handled by the `processUrl` function.
   - Parses URL, extracts and decodes 'ct' parameter, deserializes data.

3. **Result Display**:
   - Renders processed data in an expandable format.

### Data Flow
1. QR code scanned → URL extracted
2. URL processed:
   - Parse URL
   - Extract 'ct' parameter (if present)
   - Decode base64
   - Deserialize PHP data
3. Results stored in state
4. UI updated to display results

### Error Handling
- URL parsing errors caught and displayed.
- 'ct' parameter processing errors handled separately.
- Deserialization errors caught and logged.

### Customization and Extension
- **Styling**: Modify `App.css` for visual changes.
- **Additional Parameters**: Extend `processUrl` function to handle new URL parameters.
- **Different QR Content**: Modify the processing logic in `startScanner` callback for non-URL QR codes.

