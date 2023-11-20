# DEUS

> A Realtime Creation Engine

DEUS is a super flexible REALTIME image generation engine, powered by StableDiffusion and LCM Lora.

![owl.gif](owl.gif)


# Features

## 1. Text Prompt

Generate images in realtiem as you type

![prompt.gif](prompt.gif)

## 2. Draw

Draw things onto the canvas to generate images in realtime

![draw.gif](draw.gif)

## 3. Remix

The fluid UI lets you "breed" new images simply by dragging and dropping generated images into the canvas.

![dragdrop.gif](dragdrop.gif)

## 4. Import

You can also easily drag and drop any online image into DEUS.

![webremix.gif](webremix.gif)

# Install

There are two ways to install: Manual and 1-Click Install.

## 1 Click Install (RECOMMENDED)

Just find DEUS from Pinokio and click "Install":

1-Click Install link: 

## Manual Install

First clone the repository:

```
git clone https://github.com/cocktailpeanut/deus
cd deus
```

Next, move in to the server folder with `cd server`, and install the server:

```
python -m venv env
source env/bin/activate
npx torchcraft
pip install -r requirements.txt
```

Finally, move to the client folder with `cd ..` and then `cd client`, and install the client:

```
npm install
```

# Usage

## 1 Click Launcher (RECOMMENDED)

When using Pinokio, all you need to do is just click "Launch" from Pinokio.

## Manual Launch

First, switch to the `deus/server` folder and start the server:

```
source env/bin/activate
uvicorn app:app
```

Next, switch to the `deus/client` folder start the nextjs server for the client:

```
npm run dev
```

Now open the browser at http://localhost:3000
