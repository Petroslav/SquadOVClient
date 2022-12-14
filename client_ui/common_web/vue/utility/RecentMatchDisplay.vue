<template>
    <!-- Display username/game, VOD preview, and match summary -->
    <div class="full-width">
        <div class="d-flex align-center">
            <v-img
                class="mr-4"
                :src="$root.generateAssetUri(gameToIcon(match.game))"
                max-width="24px"
                width="24px"
                max-height="24px"
                height="24px"
                contain
            >
            </v-img>

            <div class="d-flex align-center">
                <div class="text-center text-caption">
                    {{ pov.username }} played...
                </div>

                <sub-icon hide-basic :tier="pov.tier">
                </sub-icon>
            </div>

            <v-spacer></v-spacer>

            <bulk-tag-display
                class="flex-grow-1 justify-end"
                :video-uuid="pov.vod.videoTracks[0].metadata.videoUuid"
                :tags="pov.tags"
                :max-tags="7"
            >
            </bulk-tag-display>

            <template v-if="!!pov.favoriteReason">
                <div class="text-right text-caption">
                    {{ pov.favoriteReason }}
                </div>

                <v-tooltip bottom>
                    <template v-slot:activator="{on, attrs}">
                        <v-icon
                            v-bind="attrs"
                            v-on="on"
                            color="warning"
                        >
                            mdi-star
                        </v-icon>
                    </template>

                    {{ pov.favoriteReason }}
                </v-tooltip>
            </template>

            <v-icon v-if="pov.isWatchlist">
                mdi-playlist-check
            </v-icon>
        </div>

        <div
            class="d-flex align-center full-width"
            @mouseover="onHover"
            @mouseout="onLeave"
        >
            <video-preview-player
                v-if="!disablePreview && !forceNoPreview"
                :vod="pov.vod"
                :use-local-vod="useLocalVodPreview"
                :access-token="pov.accessToken"
                class="recent-match-item preview-item"
                ref="player"
            >
            </video-preview-player>

            <aimlab-task-summary-display
                class="flex-grow-1 recent-match-item"
                v-if="!!pov.aimlabTask && match.game == SquadOvGames.AimLab"
                :task="pov.aimlabTask"
                :user-id="pov.userId"
                fill
                :disable-click="disableClick"
                :access-token="pov.accessToken"
            >
            </aimlab-task-summary-display>

            <lol-match-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.lolMatch && match.game == SquadOvGames.LeagueOfLegends"
                :match="pov.lolMatch"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-click="disableClick"
                :access-token="pov.accessToken"
            >
            </lol-match-summary>

            <tft-match-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.tftMatch && match.game == SquadOvGames.TeamfightTactics"
                :match="pov.tftMatch"
                :user-id="pov.userId"
                :puuid="pov.tftMatch.puuid"
                :mini="!disableMini"
                fill
                :disable-click="disableClick"
                :access-token="pov.accessToken"
            >
            </tft-match-summary>

            <valorant-player-match-summary-display
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.valorantMatch && match.game == SquadOvGames.Valorant"
                :match="pov.valorantMatch"
                :user-id="pov.userId"
                :account="pov.valorantMatch.puuid"
                fill
                :mini="!disableMini"
                :disable-click="disableClick"
                :access-token="pov.accessToken"
            >
            </valorant-player-match-summary-display>

            <wow-keystone-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.wowChallenge && match.game == SquadOvGames.WorldOfWarcraft"
                :challenge="pov.wowChallenge"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-link="disableClick"
                :access-token="pov.accessToken"
            >
            </wow-keystone-summary>

            <wow-encounter-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.wowEncounter && match.game == SquadOvGames.WorldOfWarcraft"
                :encounter="pov.wowEncounter"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-link="disableClick"
                :access-token="pov.accessToken"
            >
            </wow-encounter-summary>

            <wow-arena-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.wowArena && match.game == SquadOvGames.WorldOfWarcraft"
                :arena="pov.wowArena"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-link="disableClick"
                :access-token="pov.accessToken"
            >
            </wow-arena-summary>

            <wow-instance-summary
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.wowInstance && match.game == SquadOvGames.WorldOfWarcraft"
                :instance="pov.wowInstance"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-link="disableClick"
                :access-token="pov.accessToken"
            >
            </wow-instance-summary>

            <csgo-player-match-summary-display
                class="flex-grow-1 recent-match-item"
                v-else-if="!!pov.csgoMatch && match.game == SquadOvGames.Csgo"
                :match="pov.csgoMatch"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-link="disableClick"
                :access-token="pov.accessToken"
            >
            </csgo-player-match-summary-display>

            <hearthstone-match-summary-display
                class="flex-grow-1 recent-match-item"
                v-else-if="match.game == SquadOvGames.Hearthstone"
                :match-id="match.matchUuid"
                :user-id="pov.userId"
                :mini="!disableMini"
                fill
                :disable-click="disableClick"
                :access-token="pov.accessToken"
            >
            </hearthstone-match-summary-display>

            <upload-progress-display
                class="ml-2"
                v-if="showUploadProgress"
                :video-uuid="pov.vod.videoTracks[0].metadata.videoUuid"
            >
            </upload-progress-display>
        </div>
    </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { RecentMatch, RecentMatchPov } from '@client/js/squadov/recentMatch'
import { SquadOvGames, gameToIcon } from '@client/js/squadov/game'
import AimlabTaskSummaryDisplay from '@client/vue/utility/aimlab/AimlabTaskSummaryDisplay.vue'
import HearthstoneMatchSummaryDisplay from '@client/vue/utility/hearthstone/HearthstoneMatchSummaryDisplay.vue'
import LolMatchSummary from '@client/vue/utility/lol/LolMatchSummary.vue'
import TftMatchSummary from '@client/vue/utility/tft/TftMatchSummary.vue'
import ValorantPlayerMatchSummaryDisplay from '@client/vue/utility/valorant/ValorantPlayerMatchSummaryDisplay.vue'
import WowKeystoneSummary from '@client/vue/utility/wow/WowKeystoneSummary.vue'
import WowEncounterSummary from '@client/vue/utility/wow/WowEncounterSummary.vue'
import WowArenaSummary from '@client/vue/utility/wow/WowArenaSummary.vue'
import WowInstanceSummary from '@client/vue/utility/wow/WowInstanceSummary.vue'
import CsgoPlayerMatchSummaryDisplay from '@client/vue/utility/csgo/CsgoPlayerMatchSummaryDisplay.vue'
import VideoPreviewPlayer from '@client/vue/utility/VideoPreviewPlayer.vue'
import UploadProgressDisplay from '@client/vue/utility/squadov/UploadProgressDisplay.vue'
import BulkTagDisplay from '@client/vue/utility/vods/BulkTagDisplay.vue'
import SubIcon from '@client/vue/utility/squadov/SubIcon.vue'

@Component({
    components: {
        AimlabTaskSummaryDisplay,
        HearthstoneMatchSummaryDisplay,
        LolMatchSummary,
        TftMatchSummary,
        ValorantPlayerMatchSummaryDisplay,
        WowKeystoneSummary,
        WowEncounterSummary,
        WowArenaSummary,
        WowInstanceSummary,
        VideoPreviewPlayer,
        CsgoPlayerMatchSummaryDisplay,
        UploadProgressDisplay,
        BulkTagDisplay,
        SubIcon,
    }
})
export default class RecentMatchDisplay extends Vue {
    SquadOvGames = SquadOvGames
    gameToIcon = gameToIcon

    @Prop({required: true})
    match!: RecentMatch

    @Prop({required: true})
    pov!: RecentMatchPov

    @Prop({type: Boolean, default: false})
    disableClick!: boolean

    @Prop({type: Boolean, default: false})
    disablePreview!: boolean

    @Prop({type: Boolean, default: false})
    disableMini!: boolean

    @Prop({type: Boolean, default: false})
    useLocalVodPreview!: boolean

    @Prop({type: Boolean, default: false})
    showUploadProgress!: boolean

    forceNoPreview: boolean = false

    $refs!: {
        player: VideoPreviewPlayer
    }

    onHover() {
        if (!this.$refs.player) {
            return
        }

        if (!this.pov.isLocal || this.useLocalVodPreview) {
            this.$refs.player.startPlay()
        }
    }

    onLeave() {
        if (!this.$refs.player) {
            return
        }
        
        if (!this.pov.isLocal || this.useLocalVodPreview) {
            this.$refs.player.pausePlay()
        }
    }

    destroyPreview() {
        if (!!this.$refs.player) {
            this.$refs.player.$destroy()
            this.forceNoPreview = true
        }
    }
}

</script>

<style scoped>

.recent-match-item {
    height: 125px;
    min-height: 125px;
    max-height: 125px;
}

.preview-item {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
}

</style>