"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import { useDebounce, blobToBase64 } from "../lib/utils.js";
import Webcam from "react-webcam";
export default function Home() {
  useEffect(() => {
    import("excalidraw-cp").then((comp) => {
      setExcalidraw(comp.Excalidraw);
      setMod(comp);
    });
  }, []);
  useEffect(() => {
    fetch(items_url)
      .then((response) => {
        return response.json();
      })
      .then((res) => {
        setItems(res.map((item) => `${server_url}/${item}`));
      });
  }, []);
  const server_url = "http://127.0.0.1:8000";
  const items_url = `${server_url}/items/20`;
  const proxy_url = `${server_url}/proxy`;
  const predict_url = `${server_url}/predict`;
  const [mod, setMod] = useState(null);
  const [Excalidraw, setExcalidraw] = useState(null);
  const [items, setItems] = useState([]);
  const [p, setP] = useState("");
  const [sketch, setSketch] = useState("");
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState({ prompt: "", image: "" });
  const [showCamera, setShowCamera] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const webcamRef = React.useRef(null);
  const [webcamScreenshot, setWebcamScreenshot] = useState(null);

  const toggleMode = () => {
    setShowCamera((prevState) => !prevState);
  };

  async function _refresh(elements, appState, files, force) {
    if (elements.length === 0 && p.trim().length === 0) {
      return;
    }
    const png = await mod.exportToBlob({
      elements,
      appState,
      files: excalidrawAPI.getFiles(),
    });
    const file = new File([png], "image.png", { type: png.type });
    const dataUrl = await blobToBase64(png);
    if (loading) {
      return;
    }
    if (force) {
    } else {
      if (snapshot.image === dataUrl && snapshot.prompt === p) {
        console.log("No change");
        return;
      }
    }
    setSketch(dataUrl);
    setSnapshot({ prompt: p, image: dataUrl });
    setLoading(true);
    const b64 = dataUrl.replace("data:image/png;base64,", "");
    const result = await fetch(predict_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: p, img: b64 }),
    }).then((res) => {
      return res.json();
    });
    const url = `${server_url}/${result.filename}`;
    setItems([url].concat(items));
    setLoading(false);
  }
  async function refresh() {
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    await _refresh(elements, appState, files, true);
  }

  // Event Handlers
  const canvasUpdated = useDebounce((elements, appState, files) => {
    _refresh(elements, appState, files);
  }, 500);
  const promptUpdated = useDebounce((e) => {
    setP(e.target.value);
    refresh();
  }, 500);
  const enterPrompt = (e) => {
    if (e.key === "Enter") {
      refresh();
    }
  };
  function onLibraryChange(items) {
    console.log("library items", items);
  }

  const handleCameraChange = (event) => {
    const deviceId = event.target.value;
    setSelectedCamera(deviceId);
  };

  const captureWebcamScreenshot = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setWebcamScreenshot(screenshot);
    sendScreenshotToBackend(screenshot);
  };

  const sendScreenshotToBackend = async (screenshot) => {
    // Convert the screenshot to a data URL
    const dataUrl = screenshot;
    //@FIX CORS ERRROR
    setSketch(dataUrl);
    setSnapshot({ prompt: p, image: dataUrl });
    setLoading(true);
    const b64 = dataUrl.replace("data:image/png;base64,", "");
    const result = await fetch(predict_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: p, img: b64 }),
    }).then((res) => {
      return res.json();
    });

    const url = `${server_url}/${result.filename}`;
    setItems([url].concat(items));
    setLoading(false);
  };

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);
      })
      .catch((error) => {
        console.error("Error getting media devices:", error);
      });
  }, []);

  useEffect(() => {
    if (showCamera) {
      const intervalId = setInterval(() => {
        captureWebcamScreenshot();
      }, 10000);

      return () => clearInterval(intervalId); // Clear the interval on component unmount
    }
  }, [showCamera]);

  return (
    <div
      style={{
        height: "100%",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="p-2 box-border flex items-center bg-white border-r-4 border-solid border-gray-100">
        <a href="/" className="font-bold block p-4 text-center">
          <img
            src="/logo_white.png"
            style={{ height: "40px", display: "block", padding: "5px" }}
          />
        </a>
        <input
          type="text"
          autoFocus
          placeholder="What do you want to create?"
          onKeyPress={enterPrompt}
          onChange={(e) => promptUpdated(e)}
          className="bg-whitesmoke rounded-lg p-4 outline-none w-4/5 bg-slate-50"
        />
        <div className="flex">
          <button
            onClick={toggleMode}
            className="w-full bg-gray-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded uppercase"
          >
            {showCamera ? "Excalidraw" : "Camera"}
          </button>
          {showCamera && (
            <select
              onChange={handleCameraChange}
              className="mx-4 bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            >
              {cameras.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {`Camera ${index + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center items-center p-2 w-12">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
          </div>
        ) : (
          <button
            className="ml-2 text-white font-bold py-2 px-4 rounded bg-gray-800 hover:bg-blue-700 uppercase"
            onClick={refresh}
          >
            <div className="flex justify-center items-center ">Create</div>
          </button>
        )}
      </div>
      <div className="flex-grow flex overflow-auto">
        <div className="flex-grow h-full">
          {showCamera ? (
            <>
              <Webcam
                audio={false}
                screenshotFormat="image/png"
                videoConstraints={{
                  deviceId: selectedCamera,
                }}
                ref={webcamRef}
                proxy={proxy_url}
              />
            </>
          ) : (
            Excalidraw && (
              <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                onChange={canvasUpdated}
                proxy={proxy_url}
                onLibraryChange={onLibraryChange}
              />
            )
          )}
        </div>
        <div
          style={{
            width: "512px",
            background: "rgba(0,0,0,0.05)",
            overflow: "auto",
          }}
        >
          {loading ? (
            <div style={{ position: "relative", width: "100%" }}>
              <img
                src={sketch}
                style={{ width: "100%", opacity: 0.5 }}
                draggable="true"
              />
              <div
                role="status"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 z-10"
              >
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            </div>
          ) : (
            ""
          )}
          {items.map((item) => {
            return (
              <img
                key={item}
                src={item}
                style={{ width: "100%" }}
                draggable="true"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
