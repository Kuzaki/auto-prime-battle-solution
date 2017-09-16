const ITEM_NOSTRUM = 200999, 
	BUFF_NOSTRUM = 4020

module.exports = function AutoPrimeBattleSolution(dispatch) {
	let cid = null,
		quantity = 0,
		timeout = null,
		cooldown = 0,
		nextUse = 0, 
		bgZone = -1,
		alive = false,
		mounted = false,
		inContract = false,
		inBG = false,
		loaded = false,
		loadDelay = 10000 // Delays first use to allow time for server to 
						  // inform you if you already have the buff!

	dispatch.hook('S_LOGIN', 1, event => {
		({cid} = event)
		nextUse = 0
		loaded = false
	})

	dispatch.hook('S_RETURN_TO_LOBBY', 1, event => { nostrum(true) })
	dispatch.hook('S_INVEN', 6, event => {
		for(let i of event.items) {
			if (ITEM_NOSTRUM == i.item) {
				quantity = i.amount
				nostrum(!(quantity > 0))
			}
		}
	})

	dispatch.hook('S_START_COOLTIME_ITEM', 1, event => {
		// Update cooldown to the time when cooldown finishes
		if (event.item == ITEM_NOSTRUM) cooldown = Date.now() + event.cooldown * 1000
	})

	dispatch.hook('S_ABNORMALITY_BEGIN', 2, abnormality.bind(null, 'S_ABNORMALITY_BEGIN'))
	dispatch.hook('S_ABNORMALITY_REFRESH', 1, abnormality.bind(null, 'S_ABNORMALITY_REFRESH'))
	dispatch.hook('S_ABNORMALITY_END', 1, abnormality.bind(null, 'S_ABNORMALITY_END'))

	dispatch.hook('S_BATTLE_FIELD_ENTRANCE_INFO', 1, event => { bgZone = event.zone })

	dispatch.hook('S_LOAD_TOPO', 1, event => {
		nextUse = Date.now() + loadDelay
		mounted = inContract = false
		inBG = event.zone == bgZone
		loaded = true

		nostrum(true)
	})
	dispatch.hook('S_SPAWN_ME', 1, event => { nostrum(!(alive = event.alive)) })
	dispatch.hook('S_CREATURE_LIFE', 1, event => {
		if(event.target.equals(cid) && alive != event.alive) {
			nostrum(!(alive = event.alive))

			if(!alive) {
				nextUse = 0
				mounted = inContract = false
			}
		}
	})

	dispatch.hook('S_MOUNT_VEHICLE', 1, mount.bind(null, true))
	dispatch.hook('S_UNMOUNT_VEHICLE', 1, mount.bind(null, false))

	dispatch.hook('S_REQUEST_CONTRACT', 1, contract.bind(null, true))
	dispatch.hook('S_ACCEPT_CONTRACT', 1, contract.bind(null, false))
	dispatch.hook('S_REJECT_CONTRACT', 1, contract.bind(null, false))
	dispatch.hook('S_CANCEL_CONTRACT', 1, contract.bind(null, false))

	function abnormality(type, event) {
		if(event.target.equals(cid) && event.id == BUFF_NOSTRUM) {
			nextUse = type == 'S_ABNORMALITY_END' ? 0 : Date.now() + event.duration
			nostrum()
		}
	}

	function mount(enter, event) {
		if(event.target.equals(cid)) nostrum(mounted = enter)
	}

	function contract(enter) {
		nostrum(inContract = enter)
	}

	function nostrum(disable) {
		clearTimeout(timeout)

		if(!disable && alive && !mounted && !inContract && !inBG && quantity > 0 && loaded) timeout = setTimeout(useNostrum, nextUse - Date.now())
	}

	function useNostrum() {
		let time = Date.now()

		if(time >= cooldown) {
			if(quantity > 0) {
				dispatch.toServer('C_USE_ITEM', 1, {
					ownerId: cid,
					item: 200999, // Prime Battle Solution: 200999
					id: 0,
					unk1: 0,
					unk2: 0,
					unk3: 0,
					unk4: 1,
					unk5: 0,
					unk6: 0,
					unk7: 0,
					x: 0, 
					y: 0, 
					z: 0, 
					w: 0, 
					unk8: 0,
					unk9: 0,
					unk10: 0,
					unk11: 1,
				})
				quantity -= 1
			}
		}
		else timeout = setTimeout(useNostrum, cooldown - time)
	}
}