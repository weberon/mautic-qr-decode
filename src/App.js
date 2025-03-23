import React, { useState, useRef } from "react";
import QrScanner from "qr-scanner";
import './App.css';

function phpUnserialize(data) {
    let index = 0;

    function parseValue() {
        const dataType = data[index];
        index++;

        switch (dataType) {
            case 'i':
                const intMatch = data.slice(index).match(/^\:(\d+)\;/);
                if (intMatch) {
                    index += intMatch[0].length;
                    return parseInt(intMatch[1], 10);
                }
                break;
            case 'd':
                const floatMatch = data.slice(index).match(/^\:(\d+\.?\d*)\;/);
                if (floatMatch) {
                    index += floatMatch[0].length;
                    return parseFloat(floatMatch[1]);
                }
                break;
            case 'b':
                const boolMatch = data.slice(index).match(/^\:([01])\;/);
                if (boolMatch) {
                    index += boolMatch[0].length;
                    return boolMatch[1] === '1';
                }
                break;
            case 's':
                const strLenMatch = data.slice(index).match(/^\:(\d+)\:"/);
                if (strLenMatch) {
                    const strLen = parseInt(strLenMatch[1], 10);
                    index += strLenMatch[0].length;
                    const str = data.slice(index, index + strLen);
                    index += strLen + 2; // +2 for closing quote and semicolon
                    return str;
                }
                break;
            case 'a':
                const result = {};
                const arrLenMatch = data.slice(index).match(/^\:(\d+)\:\{/);
                if (arrLenMatch) {
                    index += arrLenMatch[0].length;
                    const arrLen = parseInt(arrLenMatch[1], 10);
                    for (let i = 0; i < arrLen; i++) {
                        const key = parseValue();
                        const value = parseValue();
                        result[key] = value;
                    }
                    index++; // Skip closing '}'
                    return result;
                }
                break;
            case 'N':
                index += 1; // Skip semicolon
                return null;
            case '}':
                // End of an array, just return undefined
                return undefined;
        }
        throw new Error(`Unsupported data type or format at position ${index}: ${data.slice(index, index + 10)}...`);
    }

    return parseValue();
}

function App() {
    const [result, setResult] = useState("");
    const videoRef = useRef(null);
    const scannerRef = useRef(null);

    const processUrl = (url) => {
        console.log("Processing URL:", url);

        try {
            const urlObj = new URL(url);
            console.log("Parsed URL:", urlObj.toString());

            let ct = urlObj.searchParams.get("ct");
            if (!ct) {
                throw new Error("'ct' parameter not found in URL");
            }

            ct = ct.replace(/&$/, '');
            console.log("Extracted 'ct' parameter:", ct);

            const decoded = atob(ct);
            console.log("Base64 decoded:", decoded);

            const deserialized = phpUnserialize(decoded);
            console.log("PHP deserialized:", deserialized);

            // Extract the "lead" value
            if (typeof deserialized === 'object' && 'lead' in deserialized) {
                return deserialized.lead.toString();
            } else {
                throw new Error("'lead' key not found in deserialized data");
            }
        } catch (error) {
            console.error("Processing error:", error);
            return `Processing Error: ${error.message}`;
        }
    };

    const startScanner = () => {
        if (scannerRef.current) scannerRef.current.stop();

        const scanner = new QrScanner(
            videoRef.current,
            (result) => {
                console.log("QR Code scanned. Raw result:", result);

                if (result && typeof result === 'object' && 'data' in result) {
                    const url = result.data;
                    console.log("Extracted URL from QR code:", url);
                    const processedResult = processUrl(url);
                    setResult(processedResult);
                } else {
                    console.error("Invalid QR code data:", result);
                    setResult("Error: Invalid QR code data format");
                }
                scanner.stop();
            },
            {
                highlightScanRegion: true,
                highlightCodeOutline: true,
            }
        );

        scanner.start();
        scannerRef.current = scanner;
    };

    return (
        <div className="App">
            <h1>QR Code Processor</h1>
            <video ref={videoRef} className="scanner-video" />
            <div>
                <button className="scan-button" onClick={startScanner}>
                    Start Scanning
                </button>
            </div>
            {result && (
                <div className="result-container">
                    <h2>Lead Value:</h2>
                    <pre className="result-output">
                        {result}
                    </pre>
                    <button className="scan-again" onClick={() => setResult("")}>
                        Scan Next Code
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;

