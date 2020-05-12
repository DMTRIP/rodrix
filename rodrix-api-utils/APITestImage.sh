#!/bin/sh
#
#  APITestImage.sh --- test Rodrix server for API image calls
#
curl https://API:RodFasApi@ecc792242017021701.servicebus.windows.net/myebms/DAT/odata/INVENTRYIMAGES\?\$filter=PAR_AID\%20eq\%20\'GUIS1M102I9IT0B0\'\&\$select=DETAIL\&\$expand=DETAIL
