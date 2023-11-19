import torch
from diffusers import DiffusionPipeline
class Engine:
  def __init__(self):
    mps_available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    xpu_available = hasattr(torch, "xpu") and torch.xpu.is_available()
    self.device = torch.device(
        "cuda" if torch.cuda.is_available() else "xpu" if xpu_available else "cpu"
    )
    self.torch_device = self.device
    self.torch_dtype = torch.float32
    if mps_available:
      #    device = torch.device("mps")
        self.device = "mps:0"
        self.torch_device = "cpu"
        self.torch_dtype = torch.float32

    self.pipe = DiffusionPipeline.from_pretrained(
      "SimianLuo/LCM_Dreamshaper_v7",
      revision="fb9c5d167af11fd84454ae6493878b10bb63b067",
      safety_checker=None,
      custom_pipeline="latent_consistency_img2img"
    )
    self.pipe.to(torch_device=self.torch_device, torch_dtype=self.torch_dtype).to(self.device)
    self.pipe.set_progress_bar_config(disable=True)

  def generate(self, prompt, input_image):
    #image = pipe(prompt, image=input_image, num_inference_steps=4, guidance_scale=8.0, lcm_origin_steps=50, strength=0.8).images[0]
    image = self.pipe(
      prompt,
      image=input_image,
      num_inference_steps=4,
      guidance_scale=1.0,
#      guidance_scale=0.7,
      lcm_origin_steps=50,
      strength=0.8
#      strength=1
    ).images[0]
    #return image.resize((768, 768))
    return image.resize((512,512))
