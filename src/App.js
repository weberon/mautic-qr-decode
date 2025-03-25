import React, { useState, useEffect, useRef, useCallback } from "react";
import QrScanner from "qr-scanner";
import './App.css';

function phpUnserialize(data) {
    let index = 0;

    function parseValue() {
        if (index >= data.length) return null;
        const dataType = data[index];
        index++;

        switch (dataType) {
            case 'i': { // Integer
                const intMatch = data.slice(index).match(/^:(-?\d+);/);
                if (intMatch) {
                    index += intMatch[0].length;
                    return parseInt(intMatch[1], 10);
                }
                break;
            }
            case 'd': { // Double
                const floatMatch = data.slice(index).match(/^:([+-]?\d+\.?\d*);/);
                if (floatMatch) {
                    index += floatMatch[0].length;
                    return parseFloat(floatMatch[1]);
                }
                break;
            }
            case 'b': { // Boolean
                const boolMatch = data.slice(index).match(/^:([01]);/);
                if (boolMatch) {
                    index += boolMatch[0].length;
                    return boolMatch[1] === '1';
                }
                break;
            }
            case 's': { // String
                const strLenMatch = data.slice(index).match(/^:(\d+):"/);
                if (strLenMatch) {
                    const strLen = parseInt(strLenMatch[1], 10);
                    index += strLenMatch[0].length;
                    const str = data.substr(index, strLen);
                    index += strLen + 2; // Skip string and closing ";
                    return str;
                }
                break;
            }
            case 'a': { // Array
                const arrLenMatch = data.slice(index).match(/^:(\d+):{/);
                if (arrLenMatch) {
                    index += arrLenMatch[0].length;
                    const arrLen = parseInt(arrLenMatch[1], 10);
                    const result = {};
                    for (let i = 0; i < arrLen; i++) {
                        const key = parseValue();
                        const value = parseValue();
                        result[key] = value;
                    }
                    if (data[index] === '}') index++;
                    return result;
                }
                break;
            }
            case 'N': // Null
                index++;
                return null;
            default:
                throw new Error(`Unsupported data type '${dataType}' at position ${index-1}`);
        }
        throw new Error(`Parse error at position ${index-1}`);
    }

    try {
        return parseValue();
    } catch (e) {
        console.error("Unserialize error:", e);
        return null;
    }
}

function App() {
    const [result, setResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const videoRef = useRef(null);
    const scannerRef = useRef(null);

    const processUrl = useCallback((url) => {
        console.log("Processing URL:", url);

        try {
            const urlObj = new URL(url);
            console.log("Parsed URL:", urlObj.toString());

            let ct = urlObj.searchParams.get("ct");
            let deserialized = null;
            let lead = null;
            let ctError = null;

            if (ct) {
                try {
                    ct = ct.replace(/&$/, '');
                    console.log("Extracted 'ct' parameter:", ct);

                    const decoded = atob(ct);
                    console.log("Base64 decoded:", decoded);

                    deserialized = phpUnserialize(decoded);
                    console.log("PHP deserialized:", deserialized);

                    lead = deserialized?.lead?.toString() || null;
                } catch (error) {
                    console.error("Error processing 'ct' parameter:", error);
                    ctError = error.message;
                }
            }

            return {
                lead: lead,
                host: urlObj.host,
                path: urlObj.pathname,
                params: Object.fromEntries(urlObj.searchParams.entries()),
                fullUrl: url,
                deserialized: deserialized,
                ctError: ctError
            };
        } catch (error) {
            console.error("Processing error:", error);
            return { error: error.message };
        }
    }, []);

    const startScanner = useCallback(() => {
        if (scannerRef.current) {
            scannerRef.current.start();
            return;
        }

        scannerRef.current = new QrScanner(
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
                    setResult({ error: "Invalid QR code data format" });
                }
            },
            { highlightScanRegion: true, highlightCodeOutline: true }
        );

        scannerRef.current.start();
    }, [processUrl]);

    const handleStartScanning = useCallback(() => {
        setIsScanning(true);
        startScanner();
    }, [startScanner]);

    useEffect(() => {
        if (isScanning) {
            startScanner();
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.destroy();
                scannerRef.current = null;
            }
        };
    }, [isScanning, startScanner]);

    return (
        <div className="App">
            <h2>Decode QR Code</h2>
            <video ref={videoRef} className="scanner-video" muted playsInline />
            {!isScanning && (
                <div className="button-container">
                    <button className="start-scan-button" onClick={handleStartScanning}>
                        Start Scanning
                    </button>
                </div>
            )}

            {result && !result.error && (
                <div className="result-container">
                    <div className="result-header">
                        <div className="host-port">Host: {result.host}</div>
                        <div className="lead-id">Lead ID: {result.lead || "N/A"}</div>
                    </div>
                    
                    <div className="url-section">
                        <button 
                            className="url-toggle" 
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? '▼' : '▶'} Details
                        </button>
                        {expanded && (
                            <div className="full-url expanded">
                                {result.ctError ? (
                                    <div style={{color: 'red'}}>Error processing 'ct' parameter: {result.ctError}</div>
                                ) : result.deserialized ? (
                                    <>
                                        <div>Deserialized Data:</div>
                                        {Object.entries(result.deserialized).map(([key, value]) => (
                                            <div key={key}>{key}: {JSON.stringify(value)}</div>
                                        ))}
                                    </>
                                ) : (
                                    <div>Deserialized Data: N/A</div>
                                )}
                                <div style={{marginTop: '10px'}}>Path: {result.path}</div>
                                {Object.entries(result.params).map(([key, value]) => 
                                    <div key={key}>{key}: {value}</div>
                                )}
                                <div style={{marginTop: '10px'}}>Full URL:</div>
                                <div>{result.fullUrl}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result?.error && (
                <div className="result-container error">
                    <div className="error-message">{result.error}</div>
                </div>
            )}
        </div>
    );
}

export default App;

