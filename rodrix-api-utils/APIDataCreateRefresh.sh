#!/bin/sh
# APIDataCreateRefresh.sh --- get all inventory data for Rodrix via API
#
# Prompts for pswrd: RodRixApi
#
echo '
Collecting Rodrix data via API...'
curl  'https://API:RodFasApi@ecc792242017021701.servicebus.windows.net/myebms/DAT/odata/INVENTRY/?$select=AUTOID,ID,TREE_ID,DESCR_1,DEF_UNIT,T_ON_HAND'             >EBMS-INVENTRY.json
curl  'https://API:RodFasApi@ecc792242017021701.servicebus.windows.net/myebms/DAT/odata/INVENTRE/?$select=TREE_ID,AUTOID,PARENT_ID,TREE_PATH,TREE_DESCR,WEB_DESCR1' >EBMS-INVENTRE.json

#...for production, run database update as well
#
echo '
Running parser...'
node rodrix-api-database.js >databaseAPI.log 2>&1 &
echo '\nRunning in background. See databaseAPI.log for processing.'