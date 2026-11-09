import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(100);
Config.setCodec('h264');
Config.setCrf(16);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
Config.setDelayRenderTimeoutInMilliseconds(120000);
