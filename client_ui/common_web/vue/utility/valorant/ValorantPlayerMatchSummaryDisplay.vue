<template>
    <div>
        <router-link :to="gameTo" :event="disableClick ? '' : 'click'">
            <v-sheet
                :class="`match-summary ${fill ? 'full-parent-height' : ''}`"
                rounded
                :style="style"
            >
                <v-row no-gutters :class="`${fill ? 'full-parent-height' : ''}`">
                    <v-col cols="2" align-self="center">
                        <valorant-agent-icon
                            :agent="match.characterId"
                            :width-height="100"
                        >
                        </valorant-agent-icon>
                    </v-col>

                    <v-col :cols="mini ? 2 : 1" align-self="center">
                        <p :style="wlColorStyle">
                            {{ match.roundsWon }} - {{ match.roundsLost }}
                        </p>

                        <v-chip :style="csRankStyle">{{ csRank }}</v-chip>
                    </v-col>

                    <v-col :cols="mini ? 2 : 4" align-self="center">
                        <valorant-hit-tracker
                            :headshots="match.headshots"
                            :bodyshots="match.bodyshots"
                            :legshots="match.legshots"
                            :mini="mini"
                        >
                        </valorant-hit-tracker>
                    </v-col>

                    <v-col :cols="mini ? 4 : 3" align-self="center">
                        <div>
                            {{ match.kills }} / {{ match.deaths}} / {{ match.assists }} <span v-if="!mini">({{ kda }})</span>
                        </div>

                        <div>
                            <span class="stat-label">DPR </span> {{ dpr }}
                            <span class="stat-label">CSPR </span> {{ cspr }}
                        </div>

                        <div v-if="!!match.serverStartTimeUtc">
                            {{ standardFormatTime(match.serverStartTimeUtc )}}
                        </div>
                    </v-col>
                </v-row>

                <!-- Game Type (Map) in top right corner -->
                <div class="mode-div text-overline" :style="queueTypeStyle">
                    {{ queueType }} ({{ mapName }})
                </div>

                <!-- VOD presence indicator in bottom right corner-->
                <div class="vod-div" v-if="hasVod">
                    <v-icon color="black">
                        mdi-video
                    </v-icon>
                </div>
            </v-sheet>
        </router-link>
    </div>
</template>

<script lang="ts">

import Component, { mixins } from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { ValorantPlayerMatchSummary, getGameMode, getIsCustom } from '@client/js/valorant/valorant_matches'
import { kda, dpr, cspr } from '@client/js/valorant/valorant_player_stats'
import { getOrdinal } from '@client/js/ordinal'
import { getValorantContent } from '@client/js/valorant/valorant_content'
import { VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'
import { standardFormatTime } from '@client/js/time'
import ValorantAgentIcon from '@client/vue/utility/valorant/ValorantAgentIcon.vue'
import ValorantHitTracker from '@client/vue/utility/valorant/ValorantHitTracker.vue'
import * as pi from '@client/js/pages'
import CommonComponent from '@client/vue/CommonComponent'

@Component({
    components: {
        ValorantAgentIcon,
        ValorantHitTracker
    }
})
export default class ValorantPlayerMatchSummaryDisplay extends mixins(CommonComponent) {
    standardFormatTime = standardFormatTime

    @Prop({required: true})
    match! : ValorantPlayerMatchSummary

    @Prop({required: true})
    userId!: number

    @Prop({type: Boolean, default: false})
    mini!: boolean

    @Prop({type: Boolean, default: false})
    fill!: boolean

    @Prop({required: true})
    account!: string

    @Prop({type: Boolean, default: false})
    disableClick!: boolean

    @Prop()
    accessToken!: string | undefined

    vod: VodAssociation | null = null

    get hasVod() : boolean {
        return !!this.vod
    }

    get gameTo(): any {
        return {
            name: pi.ValorantMatchPageId,
            params: {
                ...this.$route.params,
                matchUuid: this.match.matchUuid,
            },
            query: {
                ...this.cleanQuery,
                account: this.account,
                userId: this.userId,
                at: this.accessToken,
            },
        }
    }

    get csRank() : string {
        return getOrdinal(this.match.combatScoreRank)
    }

    get csRankStyle() : any {
        let color = 'color-neutral-place'
        if (this.match.combatScoreRank == 1) {
            color = 'color-first-place'
        } else if (this.match.combatScoreRank == 2) {
            color = 'color-second-place'
        } else if (this.match.combatScoreRank == 3) {
            color = 'color-third-place'
        }
        return {
            'background-color': `var(--${color})`
        }
    }

    get winLossColor() : string {
        let color : string = !!this.match.won ? 'color-top-place' : 'color-bottom-place'
        return color
    }

    get queueType() : string {
        let queue = getGameMode(this.match.gameMode, this.match.isRanked)
        if (!queue || !this.match.provisioningFlowId) {
            return 'Unknown'
        }

        if (getIsCustom(this.match.provisioningFlowId)) {
            queue = `[Custom] ${queue}`
        }
        return queue
    }

    get queueTypeStyle() : any {
        let color = ''
        let queue = getGameMode(this.match.gameMode, this.match.isRanked)
        if (!!this.match.provisioningFlowId && getIsCustom(this.match.provisioningFlowId)) {
            color = 'color-val-custom'
        } else if (this.match.isRanked) {
            color = 'color-val-ranked'
        } else if (queue == 'Unrated') {
            color = 'color-val-unrated'
        } else if (queue == 'Deathmatch') {
            color = 'color-val-deathmatch'
        } else if (queue == 'Spike Rush') {
            color = 'color-val-spikerush'
        } else if (queue == 'Escalation') {
            color = 'color-val-escalation'
        } else if (queue == 'Replication') {
            color = 'color-val-replication'
        } else {
            color = 'color-val-unknown'
        }

        return {
            'background-color': `var(--${color})`,
        }
    }

    get mapName() : string {
        if (!this.match.mapId) {
            return 'Unknown'
        }

        let cnt = getValorantContent(null)
        return cnt.mapAssetPathToName(this.match.mapId)
    }

    get style() : any {
        let style: any = {
            'border-left': `5px solid var(--${this.winLossColor})`,
            'background-position': 'right center',
            'background-size': '55% auto',
        }

        if (!!this.match.mapId) {
            // @ts-ignore
            style['background-image'] = `linear-gradient(to right, #1E1E1E 0 10%, transparent), url(${this.$root.generateAssetUri(`assets/valorant/maps/preview/${this.mapName}.jpg`)})`
        }

        return style
    }

    get wlColorStyle() : any {
        return {
            'color': `var(--${this.winLossColor})`
        }
    }

    get kda() : string {
        return kda(this.match.kills, this.match.assists, this.match.deaths).toFixed(2)
    }

    get dpr() : string {
        return dpr(this.match.totalDamage, this.match.roundsPlayed).toFixed(2)
    }

    get cspr() : string {
        return cspr(this.match.totalCombatScore, this.match.roundsPlayed).toFixed(2)
    }

    @Watch('userId')
    refreshVod() {
        apiClient.accessToken().accessToken(this.accessToken).findVodFromMatchUserId(this.match.matchUuid, this.userId).then((resp : ApiData<VodAssociation>) => {
            this.vod = resp.data
        }).catch((err : any) => {
            this.vod = null
        })
    }

    mounted() {
        this.refreshVod()
    }
}

</script>

<style scoped>

.match-summary {
    width: 100%;
    position: relative;
}

.stat-label {
    font-weight: bold;
}

.mode-div {
    position: absolute;
    right: 0;
    top: 0;
    border-radius: 0px 4px 0px 10px;
    padding: 4px;
    line-height: 1.2rem !important;
}

</style>