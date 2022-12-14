<template>
    <generic-vod-picker
        :value="vod"
        @input="selectVod"
        :options.sync="orderedVods"
        :match-uuid="matchUuid"
        :timestamp="timestamp"
        :game="game"
        :disable-favorite="disableFavorite"
        :enable-draw="enableDraw"
        @update:enableDraw="$emit('update:enableDraw', arguments[0])"
    >
        <template v-slot:vod="{ivod, selected}">
            <lol-participant-display
                :participant="participantFromUserUuid(ivod.userUuid)"
                :current-participant-id="currentParticipantId"
                :match="match"
                :width-height="48"
                no-border
                :class="(!!selected && ivod.videoUuid === selected.videoUuid) ? 'selected-pov' : (friendlyPovSet.has(ivod.videoUuid)) ? 'friendly-pov' : 'enemy-pov'"
            >
            </lol-participant-display>
        </template>
    </generic-vod-picker>
</template>

<script lang="ts">

import Component, {mixins} from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'
import { LeagueMatchAccessibleVods } from '@client/js/squadov/vod'
import {
    LolMatch,
    extractSameTeamPlayersFromParticipantId,
    extractEnemyTeamPlayersFromParticipantId,
    extractSameTeamPlayersFromTeamId,
    getPlayerFromParticipantId,
} from '@client/js/lol/matches'
import { LolParticipant } from '@client/js/lol/participant'
import LolParticipantDisplay from '@client/vue/utility/lol/LolParticipantDisplay.vue'
import GenericVodPicker from '@client/vue/utility/vods/GenericVodPicker.vue'
import { SquadOvGames } from '@client/js/squadov/game'
import CommonComponent from '@client/vue/CommonComponent'

@Component({
    components: {
        LolParticipantDisplay,
        GenericVodPicker,
    }
})
export default class LolVodPicker extends mixins(CommonComponent) {
    @Prop({required: true})
    matchUuid!: string

    @Prop({required: true})
    currentParticipantId!: number | undefined | null

    @Prop({required: true})
    match!: LolMatch

    @Prop({required: true})
    vod!: VodAssociation | null

    @Prop()
    timestamp!: Date | undefined | null

    @Prop({type: Boolean, default: false})
    disableFavorite!: boolean

    @Prop({type: Boolean, default: false})
    enableDraw!: boolean

    availableVods: LeagueMatchAccessibleVods | null = null

    get game(): SquadOvGames {
        return SquadOvGames.LeagueOfLegends
    }

    get numPovs(): number {
        if (!this.availableVods) {
            return 0
        }
        return this.availableVods.vods.length
    }

    @Watch('matchUuid')
    @Watch('isActive')
    refreshData() {
        if (!this.isActive) {
            return
        }
        this.availableVods = null
        apiClient.accessToken().getLolMatchAccessibleVods(this.matchUuid).then((resp: ApiData<LeagueMatchAccessibleVods>) => {
            this.availableVods = resp.data
        }).catch((err: any) => {
            console.error('Failed to obtain LoL VODs: ', err)
        })
    }

    participantFromUserUuid(userUuid: string): LolParticipant | undefined {
        if (!this.availableVods) {
            return undefined
        }

        let participantId = this.availableVods.userMapping[userUuid]
        if (!participantId) {
            return undefined
        }

        return getPlayerFromParticipantId(this.match, participantId)
    }

    get participantIdToUserUuid(): Map<number, string> {
        let ret = new Map()
        if (!!this.availableVods) {
            for (let [uuid, participantId] of Object.entries(this.availableVods.userMapping)) {
                ret.set(<number>participantId, <string>uuid)
            }
        }
        return ret
    }

    get uuidToVod(): Map<string, VodAssociation> {
        let map = new Map<string, VodAssociation>()
        if (!!this.availableVods) {
            for (let v of this.availableVods.vods) {
                map.set(v.userUuid, v)
            }
        }
        return map
    }

    get friendlyParticipants(): LolParticipant[] {
        if (!!this.currentParticipantId) {
            return extractSameTeamPlayersFromParticipantId(this.match, this.currentParticipantId)!
        } else {
            return extractSameTeamPlayersFromTeamId(this.match, 100)
        }
    }

    get enemyParticipants(): LolParticipant[] {
        if (!!this.currentParticipantId) {
            return extractEnemyTeamPlayersFromParticipantId(this.match, this.currentParticipantId)!
        } else {
            return extractSameTeamPlayersFromTeamId(this.match, 200)
        }
    }

    orderedVods: VodAssociation[] = []
    
    @Watch('friendlyPovs')
    @Watch('enemyPovs')
    syncOptions() {
        this.orderedVods = [...this.friendlyPovs, ...this.enemyPovs]
    }

    get friendlyPovs(): VodAssociation[] {
        return <VodAssociation[]>this.friendlyParticipants.map((ele: LolParticipant) => {
            let userUuid = this.participantIdToUserUuid.get(ele.participantId)
            if (!userUuid) {
                return undefined
            }

            return this.uuidToVod.get(userUuid)
        }).filter((ele: VodAssociation | undefined) => {
            return !!ele
        })
    }

    get friendlyPovSet(): Set<string> {
        return new Set(this.friendlyPovs.map((ele: VodAssociation) => ele.videoUuid))
    }

    get enemyPovs(): VodAssociation[] {
        return <VodAssociation[]>this.enemyParticipants.map((ele: LolParticipant) => {
            let userUuid = this.participantIdToUserUuid.get(ele.participantId)
            if (!userUuid) {
                return undefined
            }

            return this.uuidToVod.get(userUuid)
        }).filter((ele: VodAssociation | undefined) => {
            return !!ele
        })
    }

    selectParticipantId(participantId: number | undefined | null) {
        if (!participantId) {
            // In this case we want to select any available VOD.
            if (this.numPovs > 0) {
                this.selectVod(this.availableVods!.vods[0])
            }
            return
        }

        // In other failure cases, we want to make sure the state doesn't change.
        let userUuid = this.participantIdToUserUuid.get(participantId)
        if (!userUuid) {
            console.warn('Cannot select participant id [no user uuid]: ', participantId)
            return
        }

        let vod = this.uuidToVod.get(userUuid)
        if (!vod) {
            console.warn('Cannot select participant id [no vod]: ', participantId)
            return
        }

        this.selectVod(vod)
    }

    selectVod(vod: VodAssociation | null) {
        if (!!vod) {
            if (vod.videoUuid === this.vod?.videoUuid) {
                return
            }

            if (!this.availableVods) {
                return
            }
        }
        this.$emit('update:vod', vod)
    }

    @Watch('availableVods')
    onChangeVods() {
        this.$emit('update:vod', null)
        this.selectParticipantId(this.currentParticipantId)
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

.friendly-pov {
    border: 2px solid var(--color-friendly) !important;
}

.enemy-pov {
    border: 2px solid var(--color-enemy) !important;
}

.selected-pov {
    border: 2px solid var(--color-self) !important;
}

.selection-div {
    cursor: pointer;
}

</style>