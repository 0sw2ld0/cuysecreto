#!/bin/sh
# Prueba del modo "sorteo hecho a mano".
API=${API:-http://localhost:54321}
KEY=${KEY:-}
rpc() { curl -s -X POST "$API/rpc/$1" -H "Content-Type: application/json" ${KEY:+-H "apikey: $KEY"} -d "$2"; }
j() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);console.log(eval('o'+process.argv[1]))})" "$1"; }
C=$(rpc cs_create_event '{"p_name":"Manual Test","p_budget":50,"p_currency":"PEN","p_exchange_date":null,"p_note":null,"p_participants":["Ana","Beto","Caro"]}')
CODE=$(echo "$C" | j .code); ADM=$(echo "$C" | j .admin_token); echo "evento $CODE"
P=$(rpc cs_event_public "{\"p_code\":\"$CODE\"}")
A=$(echo "$P" | j ".participants.find(x=>x.name==='Ana').id"); B=$(echo "$P" | j ".participants.find(x=>x.name==='Beto').id")
TA=$(rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$A\",\"p_pin\":\"1111\"}" | j .token)
TB=$(rpc cs_join "{\"p_code\":\"$CODE\",\"p_participant\":\"$B\",\"p_pin\":\"2222\"}" | j .token)
rpc cs_wish_save "{\"p_token\":\"$TB\",\"p_id\":null,\"p_title\":\"Termo\",\"p_note\":null,\"p_store\":\"Ripley\",\"p_url\":null,\"p_price\":40,\"p_priority\":1}" >/dev/null
echo "listas en modo app (debe fallar):"; rpc cs_group_wishes "{\"p_token\":\"$TA\"}"; echo
echo "pasar a manual:"; rpc cs_admin_set_draw_mode "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\",\"p_mode\":\"manual\"}" | j .event.draw_mode
echo "listas en manual (Ana ve a Beto y Caro, no a sí misma):"; rpc cs_group_wishes "{\"p_token\":\"$TA\"}" | j ".map(x=>x.name+':'+x.wishes.length).join(', ')"
echo "sortear en manual (debe fallar):"; rpc cs_admin_draw "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\"}" | j .message
echo "token falso (debe fallar):"; rpc cs_group_wishes '{"p_token":"x"}' | j .message
echo "volver a app y sortear, luego pasar a manual (debe fallar):"
rpc cs_admin_set_draw_mode "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\",\"p_mode\":\"app\"}" >/dev/null
rpc cs_admin_draw "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\"}" | j .event.drawn
rpc cs_admin_set_draw_mode "{\"p_code\":\"$CODE\",\"p_token\":\"$ADM\",\"p_mode\":\"manual\"}" | j .message
