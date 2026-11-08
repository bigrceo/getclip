Landing media (not committed). Same slots as the JS Mastery landing:
  hero-bg.webp                 hero still (landscape)
  scrub1.mp4 scrub2.mp4 scrub3.mp4   scroll-scrubbed clips (first video, second video, final)
  postcard.mp4                 looping postcard clip
  overlay.webp                 postcard frame overlay (transparent)
  jason-1.webp jason-2.webp jason-3.webp
  lucia-1.webp lucia-2.webp lucia-3.webp
Encode clips with a keyframe on every frame so seeking is instant:
  ffmpeg -i in.mp4 -an -vf scale=1920:-2 -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart out.mp4
