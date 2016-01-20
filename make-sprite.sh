#!/usr/bin/env bash
ffmpeg -i big_buck_bunny_480p_surround-fix.avi -r 3 -f image2 images/%03d.jpeg
ffmpeg -i images/4%02d.jpeg -filter_complex scale=500:-1,tile=1x100 sprite4xx.jpeg