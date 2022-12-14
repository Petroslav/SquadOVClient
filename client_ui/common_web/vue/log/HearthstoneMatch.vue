<template>
    <loading-container :is-loading="!ready">
        <template v-slot:default="{ loading }">
            <v-container fluid v-if="!loading">
                <!--
                    Header that summarizes some key details about the final state of the match.
                    Namely, we want to know the two heros, final life count, final turn, match duration.
                    Whether the player won or lost.
                -->
                <div class="d-flex align-center">
                    <hearthstone-match-header-display
                        class="flex-grow-1 mb-4"
                        :current-match="matchWrapper"
                    >
                    </hearthstone-match-header-display>

                    <match-favorite-button
                        :match-uuid="matchId"
                    >
                    </match-favorite-button>

                    <match-share-button
                        :match-uuid="matchId"
                        :game="SquadOvGames.Hearthstone"
                        :permissions="matchPermissions"
                        :full-path="$route.fullPath"
                        :timestamp="timestamp"
                        :user-id="userId"
                        :is-local="!!vod ? vod.isLocal : false"
                    >
                    </match-share-button>
                </div>
                
                <!--
                    VOD and navigatable Per-round actions            
                -->
                <v-row>
                    <v-col :cols="theaterMode ? 12 : 8">
                        <video-player
                            ref="player"
                            :vod="vod"
                            :player-height.sync="currentPlayerHeight"
                            id="match-vod"
                            @toggle-theater-mode="theaterMode = !theaterMode"
                            :ready.sync="vodReady"
                            :current-time.sync="vodTime"
                            :enable-draw="enableDraw"
                            :go-to-offset="1000"
                            :current-ts.sync="timestamp"
                            :match-uuid="matchId"
                            :game="SquadOvGames.Hearthstone"
                            :permissions="matchPermissions"
                            :full-path="$route.fullPath"
                            :timestamp="timestamp"
                            :user-id="userId"
                            :is-local="!!vod ? vod.isLocal : false"
                        >
                        </video-player>

                        <hearthstone-vod-pov-picker
                            :match-id="matchId"
                            :vod.sync="vod"
                            :ref-user-id="userId"
                            :timestamp="vodTime"
                            disable-favorite
                            :enable-draw.sync="enableDraw"
                        >
                        </hearthstone-vod-pov-picker>
                    </v-col>

                    <v-col v-if="!theaterMode" cols="4">
                        <generic-match-sidebar
                            :match-uuid="matchId"
                            :video-uuid="vod.videoUuid"
                            :style="roundEventsStyle"
                            :current-tm="vodTime"
                            v-if="!!currentMatch && !!vod"
                            :start-tm="currentMatch.metadata.matchTime"
                            @go-to-time="goToVodTime(arguments[0], false)"
                        >
                            <template v-slot:events>
                                <v-tabs grow v-model="eventSectionTab">
                                    <v-tab>
                                        Events
                                    </v-tab>

                                    <v-tab-item>
                                        <hearthstone-turn-events-display
                                            :current-match="matchWrapper"
                                            :turn="currentTurn"
                                            @go-to-event="goToVodTime(arguments[0], true)"
                                            :has-vod="hasVod && vodReady"
                                        >
                                        </hearthstone-turn-events-display>
                                    </v-tab-item>

                                    <template v-if="matchWrapper.isBattlegrounds && !!$store.state.currentUser">
                                        <!-- This show the current deck STATE (e.g. hand, graveyard, in play, etc.) -->
                                        <v-tab>
                                            Tavern
                                        </v-tab>

                                        <v-tab-item>
                                            <hearthstone-battleground-tavern-summary
                                                :height="currentPlayerHeight - 48 + 68"
                                            >
                                            </hearthstone-battleground-tavern-summary>    
                                        </v-tab-item>
                                    </template>

                                    <template v-else-if="!matchWrapper.isBattlegrounds">
                                        <!-- This show the current deck state for the start of the given round (e.g. hand, graveyard, in play, etc.) -->
                                        <v-tab>
                                            Deck
                                        </v-tab>

                                        <v-tab-item>
                                            <hearthstone-current-deck-state
                                                :deck="matchWrapper.currentPlayerDeck"
                                                :current-match="matchWrapper"
                                                :turn="currentTurn"
                                                :player-id="matchWrapper.currentPlayerId"
                                                :style="deckStateStyle"
                                            >
                                            </hearthstone-current-deck-state>
                                        </v-tab-item>
                                    </template>
                                </v-tabs>
                            </template>
                        </generic-match-sidebar>
                    </v-col>
                </v-row>

                <!--
                    Turn-timeline (mulligan + turns)
                -->
                <v-row>
                    <hearthstone-turn-timeline-display
                        id="turn-timeline"
                        :current-match="matchWrapper"
                        :turn.sync="currentTurn"
                        v-if="!matchWrapper.isBattlegrounds"
                    >
                    </hearthstone-turn-timeline-display>

                    <hearthstone-battlegrounds-turn-timeline-display
                        id="turn-timeline"
                        :current-match="matchWrapper"
                        :turn.sync="currentTurn"
                        v-else
                    >
                    </hearthstone-battlegrounds-turn-timeline-display>
                </v-row>

                <!--
                    Deck Comparison
                -->
                <v-row v-if="!matchWrapper.isBattlegrounds">
                    <v-col cols="6">
                        <template v-if="!!matchWrapper.currentPlayerDeck">
                            <div class="d-flex align-center justify-center pa-4">
                                <span class="text-h5">
                                    {{ matchWrapper.currentPlayerDeck.name }}
                                </span>
                            </div>
                            <v-divider></v-divider>
                            <hearthstone-match-deck-display
                                :deck="matchWrapper.currentPlayerDeck"
                            >
                            </hearthstone-match-deck-display>
                        </template>
                    </v-col>

                    <v-col cols="6">
                        <template v-if="!!matchWrapper.opposingPlayerDeck">
                            <div class="d-flex align-center justify-center pa-4">
                                <span class="text-h5">
                                    {{ matchWrapper.opposingPlayerDeck.name }}
                                </span>
                            </div>
                            <v-divider></v-divider>
                            <hearthstone-match-deck-display
                                :deck="matchWrapper.opposingPlayerDeck"
                            >
                            </hearthstone-match-deck-display>
                        </template>
                    </v-col>
                </v-row>
            </v-container>
        </template>
    </loading-container>
</template>

<script lang="ts">

import Component, { mixins } from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { VodAssociation } from '@client/js/squadov/vod'
import { apiClient, ApiData } from '@client/js/api'
import { HearthstoneMatch as RawHearthstoneMatch, HearthstoneMatchWrapper, HearthstoneMatchLogs} from '@client/js/hearthstone/hearthstone_match'
import { SquadOvGames } from '@client/js/squadov/game'

import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import HearthstoneMatchHeaderDisplay from '@client/vue/utility/hearthstone/HearthstoneMatchHeaderDisplay.vue'
import HearthstoneTurnEventsDisplay from '@client/vue/utility/hearthstone/HearthstoneTurnEventsDisplay.vue'
import HearthstoneTurnTimelineDisplay from '@client/vue/utility/hearthstone/HearthstoneTurnTimelineDisplay.vue'
import HearthstoneBattlegroundsTurnTimelineDisplay from '@client/vue/utility/hearthstone/HearthstoneBattlegroundsTurnTimelineDisplay.vue'
import HearthstoneMatchDeckDisplay from '@client/vue/utility/hearthstone/HearthstoneMatchDeckDisplay.vue'
import HearthstoneBattlegroundTavernSummary from '@client/vue/utility/hearthstone/HearthstoneBattlegroundTavernSummary.vue'
import HearthstoneCurrentDeckState from '@client/vue/utility/hearthstone/HearthstoneCurrentDeckState.vue'
import HearthstoneVodPovPicker from '@client/vue/utility/hearthstone/HearthstoneVodPovPicker.vue'
import VideoPlayer from '@client/vue/utility/VideoPlayer.vue'
import MatchShareButton from '@client/vue/utility/squadov/MatchShareButton.vue'
import MatchFavoriteButton from '@client/vue/utility/squadov/MatchFavoriteButton.vue'
import MatchShareBase from '@client/vue/log/MatchShareBase'
import CommonComponent from '@client/vue/CommonComponent'
import GenericMatchSidebar from '@client/vue/utility/GenericMatchSidebar.vue'

@Component({
    components: {
        LoadingContainer,
        HearthstoneMatchHeaderDisplay,
        HearthstoneTurnEventsDisplay,
        HearthstoneTurnTimelineDisplay,
        HearthstoneBattlegroundsTurnTimelineDisplay,
        HearthstoneMatchDeckDisplay,
        HearthstoneBattlegroundTavernSummary,
        HearthstoneCurrentDeckState,
        HearthstoneVodPovPicker,
        VideoPlayer,
        MatchShareButton,
        MatchFavoriteButton,
        GenericMatchSidebar,
    }
})
export default class HearthstoneMatch extends mixins(CommonComponent, MatchShareBase) {
    SquadOvGames: any = SquadOvGames
    
    @Prop({required: true})
    matchId!: string

    @Prop({type: Number, required: true})
    userId!: number

    eventSectionTab: number = 0

    // VOD display
    $refs!: {
        player: VideoPlayer
    }
    theaterMode: boolean = false
    currentPlayerHeight : number = 0
    vodTime: Date | null = null
    enableDraw: boolean = false

    // Match Info
    currentMatch: RawHearthstoneMatch | null = null
    currentTurn: number = 0

    // Match loading
    ready: boolean = false
    vodReady: boolean = false

    get roundEventsStyle() : any {
        return {
            'height': `${this.currentPlayerHeight - 48 + this.vodPickerHeight}px`,
        }
    }

    get deckStateStyle() : any {
        let style = this.roundEventsStyle
        return {
            'overflow': 'auto',
            ...style
        }
    }

    get matchWrapper() : HearthstoneMatchWrapper {
        return new HearthstoneMatchWrapper(this.currentMatch!)
    }

    get hasVod() : boolean {
        return !!this.vod
    }

    goToVodTime(tm : Date, useOffset: boolean) {
        if (!this.hasVod) {
            return
        }

        let diffMs = tm.getTime() - this.vod!.startTime.getTime()
        this.$refs.player.goToTimeMs(diffMs, useOffset)
    }

    @Watch('matchId')
    @Watch('userId')
    refreshData() {
        this.ready = false
        this.currentMatch = null
        this.refreshMatchPermissions(this.matchId, SquadOvGames.Hearthstone)
        
        apiClient.accessToken().getHearthstoneMatch(this.matchId, this.userId).then((resp : ApiData<RawHearthstoneMatch>) => {
            this.currentMatch = resp.data

            apiClient.accessToken().getHearthstoneMatchLogs(this.matchId, this.userId).then((resp: ApiData<HearthstoneMatchLogs>) => {
                this.matchWrapper.addLogs(resp.data)
                this.ready = true
            }).catch((err: any) => {
                console.error('Failed to obtain Hearthstone match logs: ', err)    
            })
        }).catch((err: any) => {
            console.error('Failed to obtain Hearthstone match: ', err)
        })
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

#turn-timeline {
    width: 100%;
}

</style>