module.exports = {
  title: "DEUS",
  description: "A Realtime Creation Engine",
  icon: "icon.png",
  menu: async (kernel) => {
    let server_installed = await kernel.exists(__dirname, "server", "env")
    let client_installed = await kernel.exists(__dirname, "client", "node_modules")
    let installed = server_installed && client_installed
    if (installed) {
      let running = await kernel.running(__dirname, "start.json")
      if (running) {
        return [{
          icon: "fa-solid fa-spin fa-circle-notch",
          text: "Running"
        }, {
          icon: "fa-solid fa-desktop",
          text: "Server",
          href: "start.json",
          params: { fullscreen: true }
        }]
      } else {
        return [{
          icon: "fa-solid fa-power-off",
          text: "Launch",
          href: "start.json",
          params: { fullscreen: true, run: true }
        }]
      }
    } else {
      return [{
        icon: "fa-solid fa-plug",
        text: "Install",
        href: "install.json",
        params: { run: true, fullscreen: true }
      }]
    }
  }
}
