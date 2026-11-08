Opening assets (not committed):
  hero-bg.webp   background still, 3560x1826 or similar (landscape)
  scrub.mp4      the clip scrubbed by scroll; encode with a keyframe on every frame so seeking is instant:
                 ffmpeg -i in.mp4 -an -vf scale=1920:-2 -c:v libx264 -g 1 -crf 23 -pix_fmt yuv420p -movflags +faststart scrub.mp4
