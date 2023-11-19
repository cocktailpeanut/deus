"use client";
import Image from 'next/image'
import React, { useEffect, useState, useRef } from "react";
import Select from 'react-select'
export default function Home() {
  const [mod, setMod] = useState(null)
  const [Excalidraw, setExcalidraw] = useState(null);
  const [items, setItems] = useState([])
  useEffect(() => {
    import("excalidraw-cp").then((comp) => {
      setExcalidraw(comp.Excalidraw)
      setMod(comp)
    });
  }, []);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/items/10").then((response) => {
      return response.json()
    }).then((res) => {
      setItems(res.map(item => `http://127.0.0.1:8000/${item}`))
    })
  }, [])

  const proxy = "http://127.0.0.1:8000/proxy"


  const [img, setImg] = useState("")
  const [p, setP] = useState("")
  const [sketch, setSketch] = useState("")
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState({ prompt: "", image: "" })

  const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);
  
    const debouncedCallback = (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
  
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  
    return debouncedCallback;
  };
  const debouncedRefresh = useDebounce((elements, appState, files) => {
    refresh(elements, appState, files);
  }, 500);
  
  async function manualRefresh() {
    const elements = excalidrawAPI.getSceneElements()
    const appState = excalidrawAPI.getAppState()
    const files = excalidrawAPI.getFiles()
    await refresh(elements, appState, files, true)
  }
  async function refresh(elements, appState, files, force) {
    console.log("elements", elements)

    if (elements.length === 0 && p.trim().length === 0) {
      return;
    }

    const png = await mod.exportToBlob({
      elements,
      appState,
      files: excalidrawAPI.getFiles(),
    })

    const file = new File([png], 'image.png', {
      type: png.type,
    });

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


    //setImg(dataUrl)

    setSketch(dataUrl)

    setSnapshot({ prompt: p, image: dataUrl })
    setLoading(true)

    console.log("dataUrl", dataUrl)
    const b64 = dataUrl.replace('data:image/png;base64,','')
    const result = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: p, img: b64, })
    }).then((res) => {
      return res.json()
    })

    const url = `http://127.0.0.1:8000/${result.filename}`
    setItems([url].concat(items))
    setLoading(false)
  }
  const debounced = useDebounce((e) => {
    setP(e.target.value)
    let appState = excalidrawAPI.getAppState()
    let elements = excalidrawAPI.getSceneElements()
    refresh(elements, appState);
  }, 500);
  function updatePrompt(e) {
    debounced(e)
  }
  function submit(e) {
    if (e.key === "Enter") {
      manualRefresh()
    }
  }
  console.log("items", items)

  return (
		<div style={{ height: "100%", inset: 0, display: 'flex', flexDirection: "column" }}>
      <div style={{ padding: "10px", boxSizing: "border-box", display: "flex", alignItems: "center", background: "white", borderRight: "4px solid rgba(0,0,0,0.1)" }}>
        <a href="/" style={{fontWeight: "bold", display: "block", padding: "10px 20px"}}>DEUS</a>
        <input type='text' placeholder="What do you want to create?" onKeyPress={submit} onChange={updatePrompt} style={{ background: "whitesmoke", borderRadius: "5px", padding: "10px", outline: "none", width: "100%" }} />
        { loading ? (
          <div className="flex justify-center items-center" style={{padding: "10px"}}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
          </div>
        ) : (
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded =" style={{zIndex: 1000}} onClick={manualRefresh}>
            <div className="flex justify-center items-center ">
              Make
            </div>
          </button>
        )}
      </div>
      <div style={{flexGrow: 1, display: "flex", overflow: "auto" }}>
        <div style={{ flexGrow: 1, height: "100%" }}>
          {Excalidraw && <Excalidraw excalidrawAPI={(api)=> setExcalidrawAPI(api)} onChange={debouncedRefresh} proxy={proxy} /> }
        </div>
        <div style={{ width: "512px", background: "rgba(0,0,0,0.05)", overflow: "auto" }}>
          { loading ? 
            <img src={sketch} style={{width: "100%" }} draggable="true" />
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

function blobToBase64(blob) {
	return new Promise((resolve, _) => {
		const reader = new FileReader()
		reader.onloadend = () => resolve(reader.result)
		reader.readAsDataURL(blob)
	})
}
