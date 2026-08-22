# Landing — www.nutrifollow.app

Sitio estático (HTML/CSS/JS puro, sin build) para el landing público de NutriFollow.
Vive en este repo pero se despliega como un **proyecto de Vercel separado** de la app,
apuntando a esta carpeta.

## Contenido
- `index.html` — la página (contenido reusado de `public/landing.html`, sin el iframe,
  con SEO real: meta description, canonical, Open Graph, Twitter Card y JSON-LD).
- `robots.txt`, `sitemap.xml` — SEO técnico.
- `vercel.json` — redirige `/p/*` (links de portal de paciente ya compartidos con el
  dominio viejo) hacia `my.nutrifollow.app/p/*` con un 301, para que no se rompan.
- `logo_nutrifollow.png`, `favicon.png` — copias locales de los assets (el sitio es
  autocontenido, no depende de la app).

Los botones de "Iniciar sesión" / "Empezar gratis" / "Suscribirme a Pro" y los links del
footer (Política de Privacidad, Términos, etc.) apuntan directo a `my.nutrifollow.app`,
donde vive la app real.

## Deploy en Vercel (una sola vez)

1. En el dashboard de Vercel → **Add New → Project**.
2. Importa este mismo repo (`NutriCRM---New-copy`).
3. En "Root Directory" selecciona la carpeta **`landing`**.
4. Framework Preset: **Other** (sitio estático, sin build command, sin output directory
   especial — deja los campos por defecto).
5. Deploy.
6. Una vez desplegado, en el proyecto nuevo → **Settings → Domains** → agrega
   `www.nutrifollow.app`.
   - Como el DNS de `nutrifollow.app` ya está en los nameservers de Vercel
     (`ns1/ns2.vercel-dns.com`), Vercel debería poder asignarlo automáticamente sin
     que tengas que tocar ningún registro a mano. Si te pide mover el registro `www`
     porque ya está apuntado al proyecto de la app, es justo eso: quítalo de ahí y
     dejalo solo en este proyecto nuevo.
7. Verifica que `my.nutrifollow.app` siga apuntando al proyecto de la app (no debería
   cambiar nada ahí).

## Después de publicar

- Prueba `https://www.nutrifollow.app/` — debe cargar el landing.
- Prueba un link viejo tipo `https://www.nutrifollow.app/p/xxxxx` — debe redirigir
  (301) a `https://my.nutrifollow.app/p/xxxxx`.
- Prueba los botones de login/registro — deben llevar a `my.nutrifollow.app/login`.
- Pega el link en WhatsApp para revisar que el preview (título, descripción, imagen)
  se vea bien — usa el Open Graph que ya está configurado en `index.html`.
