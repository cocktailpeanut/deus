"use client";
import Image from 'next/image'
import React, { useEffect, useState, useRef } from "react";
import Select from 'react-select'
import { useDebounce, blobToBase64 } from '../lib/utils.js';
export default function Home() {
  useEffect(() => {
    import("excalidraw-cp").then((comp) => {
      setExcalidraw(comp.Excalidraw)
      setMod(comp)
    });
  }, []);
  useEffect(() => {
    fetch(items_url).then((response) => {
      return response.json()
    }).then((res) => {
      setItems(res.map(item => `${server_url}/${item}`))
    })
  }, [])
  const server_url = "http://127.0.0.1:8000"
  const items_url = `${server_url}/items/20`
  const proxy_url = `${server_url}/proxy`
  const predict_url = `${server_url}/predict`
  const [mod, setMod] = useState(null)
  const [Excalidraw, setExcalidraw] = useState(null);
  const [items, setItems] = useState([])
  const [p, setP] = useState("")
  const [sketch, setSketch] = useState("0")
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState({ prompt: "", image: "" })

  // Add state variables for new parameters
  const [numInferenceSteps, setNumInferenceSteps] = useState(8);
  const [seed, setSeed] = useState("0");

  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [lcmOriginSteps, setLcmOriginSteps] = useState(200);
  const [strength, setStrength] = useState(0.8);

  async function _refresh(elements, appState, files, force) {
    if (elements.length === 0 && p.trim().length === 0) {
      return;
    }
    const png = await mod.exportToBlob({ elements, appState, files: excalidrawAPI.getFiles(), })
    const file = new File([png], 'image.png', { type: png.type, });
    const dataUrl = await blobToBase64(png);
    if (loading) {
      return
    }
    if (force) {
    } else {
      if (snapshot.image === dataUrl && snapshot.prompt === p) {
        console.log("No change")
        return
      }
    }
    setSketch(dataUrl)
    setSnapshot({ prompt: p, image: dataUrl })
    setLoading(true)
    const b64 = dataUrl.replace('data:image/png;base64,','')
    
    const result = await fetch(predict_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      prompt: p,
      img: b64,
      seed:seed,
      num_inference_steps: numInferenceSteps,
      guidance_scale: guidanceScale,
      lcm_origin_steps: lcmOriginSteps,
      strength: strength
    }
  )
}).then((res) => {
  return res.json();
});
    const url = `${server_url}/${result.filename}`
    setItems([url].concat(items))
    setLoading(false)
  }
  async function refresh() {
    const elements = excalidrawAPI.getSceneElements()
    const appState = excalidrawAPI.getAppState()
    const files = excalidrawAPI.getFiles()
    await _refresh(elements, appState, files, true)
  }

  // Event Handlers
  const canvasUpdated = useDebounce((elements, appState, files) => {
    _refresh(elements, appState, files);
  }, 500);
  const promptUpdated = useDebounce((e) => {
    setP(e.target.value)
    refresh()
  }, 500);
  const enterPrompt = (e) => {
    if (e.key === "Enter") {
      refresh()
    }
  }
  function onLibraryChange(items) {
    console.log("library items", items )
  }

  return (
		<div style={{ height: "100%", inset: 0, display: 'flex', flexDirection: "column" }}>
      <div style={{ padding: "10px", boxSizing: "border-box", display: "flex", alignItems: "center", background: "white", borderRight: "4px solid rgba(0,0,0,0.1)" }}>
        <a href="/" style={{fontWeight: "bold", display: "block", padding: "10px 10px", textAlign: "center"  }}>
          <img src="/logo_white.png" style={{height: "40px", display: "block", padding: "5px" }}/>
        </a>
        <input type='text' autofocus placeholder="What do you want to create?" onKeyPress={enterPrompt} onChange={e => promptUpdated(e)} style={{ background: "whitesmoke", borderRadius: "5px", padding: "10px", outline: "none", width: "100%" }} />
        { loading ? (
          <div className="flex justify-center items-center" style={{padding: "10px"}}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
          </div>
        ) : (
          <button className="bg-gray-800 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded =" style={{marginLeft: "10px", fontSize: "14px", textTransform: "uppercase" }} onClick={refresh}>
            <div className="flex justify-center items-center ">
              Create
            </div>
          </button>
        )}
      </div>
  <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '5px',  margin: '5 30px', backgroundColor: '#f0f0f0' }}>
  <div>
    <label htmlFor="seed">Seed: </label>
    <input
      id="seed"
      type="text"
      placeholder="0 = random"
      step="1"
      value={seed}
      onChange={(e) => setSeed(e.target.value)}
      style={{ margin: '5px 30px', padding: '5px', width: '100px' }}
    />
    <label htmlFor="numInferenceSteps">Num Inference Steps: </label>
    <input
      id="numInferenceSteps"
      type="number"
      min="1"
      max="50"
      value={numInferenceSteps}
      onChange={(e) => setNumInferenceSteps(e.target.value)}
      style={{ margin: '5 30px', padding: '5px' , width: '100px'}}
    />
    <label htmlFor="guidanceScale">Guidance Scale: </label>
    <input
      id="guidanceScale"
      type="number"
      min="0"
      max="30"
      step="0.5"
      value={guidanceScale}
      onChange={(e) => setGuidanceScale(e.target.value)}
      style={{ margin: '5 30px', padding: '5px' , width: '100px'}}
    />
    <label htmlFor="lcmOriginSteps">LCM Origin Steps: </label>
    <input
      id="lcmOriginSteps"
      min="1"
      max="500"
      type="number"
      value={lcmOriginSteps}
      onChange={(e) => setLcmOriginSteps(e.target.value)}
     style={{ margin: '5 30px', padding: '5px', width: '100px' }}
    />
    <label htmlFor="strength">Strength: </label>
    <input
      id="strength"
      type="number"
      min="0.1"  
      max="1"  
      step="0.025"
      value={strength}
      onChange={(e) => setStrength(e.target.value)}
      style={{ margin: '0 30px', padding: '5px' , width: '100px'}}
    />
  </div>
</div>
      <div style={{flexGrow: 1, display: "flex", overflow: "auto" }}>
        <div style={{ flexGrow: 1, height: "100%" }}>
          {Excalidraw && <Excalidraw excalidrawAPI={(api)=> setExcalidrawAPI(api)} onChange={canvasUpdated} proxy={proxy_url} onLibraryChange={onLibraryChange}/> }
        </div>
        <div style={{ width: "512px", background: "rgba(0,0,0,0.05)", overflow: "auto" }}>
          { loading ? 
            <div style={{position: "relative", width: "100%" }}>
              <img src={sketch} style={{width: "100%", opacity: 0.5 }} draggable="true" />
              <div role="status" style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "40px",
                  height: "40px",
                  zIndex: 100
                }}
              >
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
              </div>
            </div>
            : ""
          }
          {items.map((item) => {
            return <img key={item} src={item} style={{width: "100%" }} draggable="true" />
          })}
        </div>
      </div>
		</div>
  )
}
