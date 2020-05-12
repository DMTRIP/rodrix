#!/bin/sh
# APIImageCreateRefresh.sh --- get all image data for Rodrix via API
#
# Prompts for pswrd: RodRixApi
#
echo '
Running Node API app...'
node rodrix-api-images.js >imagesAPI.log 2>&1 &
echo '\nRunning in background. See imagesAPI.log for processing.'