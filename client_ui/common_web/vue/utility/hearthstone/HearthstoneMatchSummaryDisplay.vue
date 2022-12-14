<template>
    <div>
        <router-link :to="to" :event="disableClick ? '' : 'click'">
            <v-sheet
                :class="`task-summary ${fill ? 'full-parent-height' : ''}`"
                rounded
                :style="divStyle"
            >
                <v-row no-gutters v-if="!!currentMatch" :class="`${fill ? 'full-parent-height' : ''}`">
                    <!-- Hero class + Deck Name (if applicable) -->
                    <v-col :cols="mini ? 4 : 2" align-self="center">
                        <div class="d-flex justify-start">
                            <hearthstone-hero-display
                                :hero-card="deckHeroCard"
                                :max-height="100"
                                fill
                            >
                            </hearthstone-hero-display>
                        </div>

                        <div class="d-flex justify-start ml-2 my-1" v-if="isConstructed">
                            <span>
                                {{ deckName }}
                            </span>
                        </div>
                    </v-col>

                    <!-- DateTime + Game Mode -->
                    <v-col :cols="mini ? 5 : 2" align-self="center" class="text-body-2">
                        <p>
                            {{ dateTime }}
                        </p>

                        <p>
                            {{ gameMode }}
                        </p>

                        <p>
                            {{ matchLength }} - {{ numTurns }} Turns
                            <template v-if="!matchWrapper.isBattlegrounds">
                                (<span :style="currentPlayerHpStyle">{{ currentPlayerLife }}</span> - <span :style="opposingPlayerHpStyle">{{ opposingPlayerLife }}</span>)
                            </template>
                        </p>
                    </v-col>

                    <!-- Rank (if relevant) -->
                    <v-col :cols="mini ? 3 : 1" align-self="center">
                        <hearthstone-player-medal-display
                            v-if="isRanked && !matchWrapper.isBattlegrounds"
                            :medal-info="medalInfo"
                            :max-height="100"
                        >
                        </hearthstone-player-medal-display>
                        
                        <hearthstone-battlegrounds-game-leaderboard-place-display
                            v-else-if="matchWrapper.isBattlegrounds"
                            class="mx-2"
                            :current-match="matchWrapper"
                        >
                        </hearthstone-battlegrounds-game-leaderboard-place-display>

                        <hearthstone-duels-rating-display
                            v-else-if="matchWrapper.isDuels"
                            class="mx-2"
                            :current-match="matchWrapper"
                        >
                        </hearthstone-duels-rating-display>
                    </v-col>

                    <!-- Board State -->
                    <v-col :cols="matchWrapper.isBattlegrounds ? 7 : 5" align-self="center" v-if="!mini">
                        <hearthstone-mini-board-state-display
                            :snapshot="latestSnapshot"
                            :player-match-id="localPlayerMatchId"
                        >
                        </hearthstone-mini-board-state-display>
                    </v-col>

                    <!-- Enemy hero -->
                    <v-col cols="2" align-self="center" v-if="!matchWrapper.isBattlegrounds && !mini">
                        <div class="d-flex justify-end">
                            <hearthstone-hero-display
                                :hero-card="enemyHeroCard"
                                :max-height="100"
                            >
                            </hearthstone-hero-display>
                        </div>
                    </v-col>
                </v-row>

                <v-row justify="center" v-else>
                    <v-progress-circular indeterminate size=64></v-progress-circular>
                </v-row>

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

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'
import * as pi from '@client/js/pages'
import { HearthstoneMatch, HearthstoneMatchWrapper, constructGameTypeString, HearthstoneFormatType, isGameTypeConstructed, isGameTypeRanked } from '@client/js/hearthstone/hearthstone_match'
import { HearthstoneMedalInfo, HearthstonePlayer } from '@client/js/hearthstone/hearthstone_player'
import { HearthstoneEntity, HearthstoneEntityWrapper } from '@client/js/hearthstone/hearthstone_entity'
import { HearthstoneMatchSnapshot } from '@client/js/hearthstone/hearthstone_snapshot'
import { standardFormatTime, secondsToTimeString } from '@client/js/time'
import { HearthstoneCardtype } from '@client/js/hearthstone/hearthstone_cardtype'
import { HearthstonePlayState } from '@client/js/hearthstone/hearthstone_playstate'
import HearthstoneHeroDisplay from '@client/vue/utility/hearthstone/HearthstoneHeroDisplay.vue'
import HearthstonePlayerMedalDisplay from '@client/vue/utility/hearthstone/HearthstonePlayerMedalDisplay.vue'
import HearthstoneMiniBoardStateDisplay from '@client/vue/utility/hearthstone/HearthstoneMiniBoardStateDisplay.vue'
import HearthstoneBattlegroundsGameLeaderboardPlaceDisplay from '@client/vue/utility/hearthstone/HearthstoneBattlegroundsGameLeaderboardPlaceDisplay.vue'
import HearthstoneDuelsRatingDisplay from '@client/vue/utility/hearthstone/HearthstoneDuelsRatingDisplay.vue'

@Component({
    components: {
        HearthstoneHeroDisplay,
        HearthstonePlayerMedalDisplay,
        HearthstoneMiniBoardStateDisplay,
        HearthstoneBattlegroundsGameLeaderboardPlaceDisplay,
        HearthstoneDuelsRatingDisplay
    }
})
export default class HearthstoneMatchSummaryDisplay extends Vue {
    @Prop({required: true})
    matchId!: string

    @Prop({required: true})
    userId!: number

    @Prop({type: Boolean, default: false})
    fill!: boolean

    @Prop({type: Boolean, default: false})
    mini!: boolean

    @Prop({type: Boolean, default: false})
    disableClick!: boolean

    @Prop()
    accessToken!: string | undefined

    vod: VodAssociation | null = null
    currentMatch: HearthstoneMatch | null = null

    get to() : any {
        return {
            name: pi.HearthstoneMatchPageId,
            params: {
                matchId: this.matchId
            },
            query: {
                userId: this.userId,
                at: this.accessToken,
            }
        }
    }

    get hasVod() : boolean {
        return !!this.vod
    }

    get matchWrapper(): HearthstoneMatchWrapper {
        return new HearthstoneMatchWrapper(this.currentMatch!)
    }

    get currentPlayerLife(): number {
        let entity = this.matchWrapper.currentPlayerHeroEntity
        let hp = entity?.remainingHealth
        return !!hp ? hp : 0
    }

    get opposingPlayerLife(): number {
        let entity = this.matchWrapper.opposingPlayerHeroEntity
        let hp = entity?.remainingHealth
        return !!hp ? hp : 0
    }

    get deckHeroCard() : string | undefined  {
        if (!this.matchWrapper.currentPlayerId) {
            return undefined
        }
        return this.matchWrapper.playerHeroCard(this.matchWrapper.currentPlayerId)
    }

    get enemyHeroCard() : string | undefined {
        if (!this.latestSnapshot) {
            return undefined
        }

        for (let [eid, entity] of Object.entries(this.latestSnapshot.entities)) {
            let typedEntity: HearthstoneEntity = entity
            let wrappedEntity = new HearthstoneEntityWrapper(typedEntity)
            if (wrappedEntity.controller != this.localPlayerMatchId 
                && wrappedEntity.cardType == HearthstoneCardtype.Hero) {
                return wrappedEntity.cardId
            }
        }
        return undefined
    }

    get deckName() : string | undefined {
        return this.currentMatch?.metadata.deck?.name
    }

    get dateTime() : string {
        return standardFormatTime(this.currentMatch!.metadata.matchTime)
    }

    get gameMode() : string {
        return constructGameTypeString(this.currentMatch!.metadata.gameType, this.currentMatch!.metadata.formatType)
    }

    get isConstructed() : boolean {
        return isGameTypeConstructed(this.currentMatch!.metadata.gameType)
    }

    get isRanked() : boolean {
        return isGameTypeRanked(this.currentMatch!.metadata.gameType)
    }

    get localPlayerMatchId() : number | undefined {
        for (let [pid, player] of Object.entries(this.currentMatch!.metadata.players)) {
            let typedPlayer: HearthstonePlayer = player
            if (!typedPlayer.local) {
                continue
            }
            return parseInt(pid)
        }
        return undefined
    }

    get localPlayer() : HearthstonePlayer | undefined {
        if (!this.localPlayerMatchId) {
            return undefined
        }
        return this.currentMatch!.metadata.players[this.localPlayerMatchId]
    }

    get medalInfo() : HearthstoneMedalInfo | undefined {
        if (this.currentMatch!.metadata.formatType == HearthstoneFormatType.Standard) {
            return this.localPlayer?.medalInfo.standard
        } else {
            return this.localPlayer?.medalInfo.wild
        }
    }

    get matchLength() : string {
        return secondsToTimeString(this.currentMatch!.metadata.elapsedSeconds)
    }

    get numTurns() : number {
        let numTurns = this.latestSnapshot?.auxData?.currentTurn
        return !!numTurns ? numTurns : 0
    }

    get latestSnapshot(): HearthstoneMatchSnapshot | null {
        if (!this.currentMatch) {
            return null
        }
        return this.currentMatch.latestSnapshot
    }

    get won() : boolean {
        if (!this.latestSnapshot || !this.localPlayerMatchId) {
            return false
        }

        if (this.matchWrapper.isBattlegrounds) {
            let place = this.matchWrapper.currentPlayerHeroEntity?.leaderboardPlace
            return !!place ? place <= 4 : false
        } else {
            let entityId = this.latestSnapshot.playerIdToEntityId[this.localPlayerMatchId]
            let entity = new HearthstoneEntityWrapper(this.latestSnapshot.entities[entityId])
            return entity.playState == HearthstonePlayState.Won
        }
    }

    computeWLColor(w: boolean) : string {
        return w ? 'color-top-place' : 'color-bottom-place'
    }

    get winLossColor() : string {
        return this.computeWLColor(this.won)
    }

    get opposingPlayerHpColor() : string {
        return this.computeWLColor(!this.won)
    }


    get currentPlayerHpStyle() : any {
        return {
            'color': `var(--${this.winLossColor})`
        }
    }

    get opposingPlayerHpStyle() : any {
        return {
            'color': `var(--${this.opposingPlayerHpColor})`
        }
    }

    get divStyle() : any {
        return {
            'border-left': `5px solid var(--${this.winLossColor})`,
        }
    }

    @Watch('matchId')
    @Watch('userId')
    refreshData() {
        this.currentMatch = null
        apiClient.accessToken(this.accessToken).getHearthstoneMatch(this.matchId, this.userId).then((resp : ApiData<HearthstoneMatch>) => {
            this.currentMatch = resp.data
        }).catch((err: any) => {
            console.error('Failed to obtain Hearthstone match: ', err)
        })
    }

    @Watch('matchId')
    @Watch('userId')
    refreshVod() {
        this.vod = null
        apiClient.accessToken(this.accessToken).findVodFromMatchUserId(this.matchId, this.userId).then((resp : ApiData<VodAssociation>) => {
            this.vod = resp.data
        }).catch((err : any) => {
            this.vod = null
        })
    }

    mounted() {
        this.refreshData()
        this.refreshVod()
    }
}

</script>

<style scoped>

.task-summary {
    width: 100%;
    position: relative;
}

p {
    margin-bottom: 2px !important;
}

</style>