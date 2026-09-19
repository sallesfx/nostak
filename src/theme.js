// Configuração central do tema Tailwind para o Nostak
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    darkMode: "class",
    theme: {
            extend: {
                colors: {
                    "surface-container-lowest": "#060e20",
                    "on-tertiary": "#2b3137",
                    "tertiary": "#c1c7cf",
                    "on-primary": "#002e68",
                    "secondary-container": "#434957",
                    "tertiary-fixed": "#dde3eb",
                    "secondary-fixed-dim": "#c1c6d7",
                    "on-tertiary-fixed-variant": "#41474e",
                    "surface-bright": "#31394d",
                    "error": "#ffb4ab",
                    "surface-container": "#171f33",
                    "outline-variant": "#414754",
                    "surface": "#0b1326",
                    "surface-container-low": "#131b2e",
                    "primary-fixed": "#d8e2ff",
                    "tertiary-container": "#8b9199",
                    "secondary-fixed": "#dde2f3",
                    "on-surface-variant": "#c1c6d7",
                    "primary-fixed-dim": "#adc7ff",
                    "on-secondary-fixed-variant": "#414754",
                    "on-primary-fixed": "#001a41",
                    "inverse-surface": "#dae2fd",
                    "on-error-container": "#ffdad6",
                    "background": "#0b1326",
                    "primary": "#adc7ff",
                    "secondary": "#c1c6d7",
                    "on-secondary-container": "#b3b8c8",
                    "primary-container": "#4a8eff",
                    "surface-tint": "#adc7ff",
                    "tertiary-fixed-dim": "#c1c7cf",
                    "on-tertiary-container": "#242a30",
                    "on-primary-container": "#00285b",
                    "inverse-on-surface": "#283044",
                    "on-surface": "#dae2fd",
                    "surface-dim": "#0b1326",
                    "on-error": "#690005",
                    "outline": "#8b90a0",
                    "inverse-primary": "#005bc0",
                    "on-secondary-fixed": "#161c27",
                    "on-primary-fixed-variant": "#004493",
                    "error-container": "#93000a",
                    "surface-variant": "#2d3449",
                    "surface-container-high": "#222a3d",
                    "surface-container-highest": "#2d3449",
                    "on-secondary": "#2a303d",
                    "on-background": "#dae2fd",
                    "on-tertiary-fixed": "#161c22"
                },
                borderRadius: {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
                },
                spacing: {
                    "gutter": "16px",
                    "max-width": "1200px",
                    "margin-mobile": "16px",
                    "margin-desktop": "24px",
                    "unit": "4px"
                },
                fontFamily: {
                    "body-md": ["Inter", "sans-serif"],
                    "body-lg": ["Inter", "sans-serif"],
                    "headline-lg-mobile": ["EB Garamond", "serif"],
                    "headline-lg": ["EB Garamond", "serif"],
                    "headline-md": ["EB Garamond", "serif"],
                    "display-lg": ["EB Garamond", "serif"],
                    "caption": ["Inter", "sans-serif"],
                    "label-md": ["Inter", "sans-serif"],
                    "label-sm": ["Inter", "sans-serif"]
                },
                fontSize: {
                    "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                    "headline-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "500" }],
                    "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "500" }],
                    "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                    "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "500" }],
                    "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                    "caption": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
                    "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                    "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500" }]
                }
            }
        }
    };
