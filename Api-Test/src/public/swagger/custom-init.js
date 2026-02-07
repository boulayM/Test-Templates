// src/public/swagger/custom-init.js
window.onload = () => {
  const ui = SwaggerUIBundle({
    url: "/api/swagger.json", // ton Swagger JSON exposé par Express
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
    docExpansion: "none",
    tryItOutEnabled: true
  });
  window.ui = ui;
};
