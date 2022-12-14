<template>
    <generic-vod-picker
        :value="vod"
        @input="selectVod"
        :options.sync="allPovs"
        :match-uuid="matchUuid"
        :timestamp="timestamp"
        :game="game"
        :disable-favorite="disableFavorite"
        :enable-draw="enableDraw"
        @update:enableDraw="$emit('update:enableDraw', arguments[0])"
    >
        <template v-slot:vod="{ivod, selected}">
            <v-tooltip offset-x right>
                <template v-slot:activator="{on, attrs}">
                    <div
                        v-bind="attrs"
                        v-on="on"
                        class="ma-1"
                    >
                        <wow-class-spec-icon
                            v-if="charForUuid(ivod.userUuid).specId > 0"
                            :spec-id="charForUuid(ivod.userUuid).specId"
                            :class="(!!selected && selected.videoUuid === ivod.videoUuid) ? 'selected-char' : 'unselected-char'"
                            :patch="patch"
                        >
                        </wow-class-spec-icon>

                        <wow-class-icon
                            v-else-if="!!charForUuid(ivod.userUuid).classId"
                            :class-id="charForUuid(ivod.userUuid).classId"
                            :class="(!!selected && selected.videoUuid === ivod.videoUuid) ? 'selected-char' : 'unselected-char'"
                            :patch="patch"
                        >
                        </wow-class-icon>
                    </div>
                </template>

                <wow-character-display
                    :character="charForUuid(ivod.userUuid)"
                    :patch="patch"
                >
                </wow-character-display>    
            </v-tooltip>
        </template>
    </generic-vod-picker>
</template>

<script lang="ts">

import Component, {mixins} from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import {
    WowCharacter,
    WoWCharacterUserAssociation
} from '@client/js/wow/character'
import { WowMatchAccessibleVods, VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'

import WowClassSpecIcon from '@client/vue/utility/wow/WowClassSpecIcon.vue'
import WowClassIcon from '@client/vue/utility/wow/WowClassIcon.vue'
import WowCharacterDisplay from '@client/vue/utility/wow/WowCharacterDisplay.vue'
import GenericVodPicker from '@client/vue/utility/vods/GenericVodPicker.vue'
import { SquadOvGames } from '@client/js/squadov/game'
import CommonComponent from '@client/vue/CommonComponent'

@Component({
    components: {
        WowClassSpecIcon,
        WowClassIcon,
        WowCharacterDisplay,
        GenericVodPicker
    }
})
export default class WowVodPovPicker extends mixins(CommonComponent) {
    @Prop({required: true})
    vod!: VodAssociation | null

    @Prop({required: true})
    matchUuid!: string

    @Prop({required: true})
    userId!: number

    @Prop({required: true})
    matchCharacters!: WowCharacter[]

    @Prop({required: true})
    characterAssociations!: WoWCharacterUserAssociation[]

    @Prop({required: true})
    patch!: string

    @Prop()
    timestamp!: Date | undefined | null

    @Prop({type: Boolean, default: false})
    disableFavorite!: boolean

    @Prop({type: Boolean, default: false})
    enableDraw!: boolean

    allAccessibleVods: WowMatchAccessibleVods | null = null

    get game(): SquadOvGames {
        return SquadOvGames.WorldOfWarcraft
    }

    get uuidToVod(): Map<string, VodAssociation> {
        let map = new Map<string, VodAssociation>()
        if (!!this.allAccessibleVods) {
            for (let v of this.allAccessibleVods.vods) {
                map.set(v.userUuid, v)
            }
        }
        return map
    }

    get userIdToUuid(): Map<number, string> {
        let map = new Map<number, string>()
        if (!!this.allAccessibleVods) {
            for (let [uuid, userId] of Object.entries(this.allAccessibleVods.userToId)) {
                map.set(<number>userId, <string>uuid)
            }
        }
        return map
    }

    get charToObject(): Map<string, WowCharacter> {
        let ret = new Map()
        for (let c of this.matchCharacters) {
            ret.set(c.guid, c)
        }
        return ret
    }

    get userIdToChar(): Map<number, WowCharacter> {
        let ret = new Map()
        for (let assoc of this.characterAssociations) {
            let char = this.charToObject.get(assoc.guid)
            if (!char) {
                continue
            }
            
            ret.set(assoc.userId, char)
        }
        return ret
    }

    allPovs: VodAssociation[] = []
    
    @Watch('allAccessibleVods')
    syncOptions() {
        if (!this.allAccessibleVods) {
            this.allPovs = []
        } else {
            this.allPovs = this.allAccessibleVods.vods.filter((ele: VodAssociation) => {
                return !!this.charForUuid(ele.userUuid)
            })
        }
    }

    charForUuid(uuid: string): WowCharacter | null {
        if (!this.allAccessibleVods) {
            return null
        }

        let uid = this.allAccessibleVods.userToId[uuid]
        if (!uid) {
            return null
        }

        let char = this.userIdToChar.get(uid)
        if (!char) {
            return null
        }

        return char
    }

    @Watch('allAccessibleVods')
    resetVods() {
        this.$emit('update:vod', null)
        this.selectUserId(this.userId)
    }

    @Watch('matchUuid')
    @Watch('isActive')
    refreshData() {
        if (!this.isActive) {
            return
        }
        this.allAccessibleVods = null
        apiClient.accessToken().getWoWMatchAccessibleVods(this.matchUuid).then((resp: ApiData<WowMatchAccessibleVods>) => {
            this.allAccessibleVods = resp.data
        }).catch((err: any) => {
            console.error('Failed to get WoW match accessible VODs: ', err)
        })
    }

    selectUserId(userId: number) {
        let uuid = this.userIdToUuid.get(userId)
        if (!uuid) {
            console.warn(`Selected Invalid WoW Match User ID [UUID]: ${userId}`)
            return
        }

        let vod = this.uuidToVod.get(uuid)
        if (!vod) {
            console.warn(`Selected Invalid WoW Match User ID [VOD]: ${userId}`)
            return
        }
        this.selectVod(vod)
    }

    selectVod(vod: VodAssociation | null) {
        if (!!vod) {
            if (vod.videoUuid === this.vod?.videoUuid) {
                return
            }

            if (!this.allAccessibleVods) {
                return
            }
        }

        this.$emit('update:vod', vod)
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

.selection-div {
    cursor: pointer;
}

.selected-char {
    border: 2px solid var(--color-self) !important;
}

.unselected-char {
    border: 2px solid transparent !important;
}

</style>