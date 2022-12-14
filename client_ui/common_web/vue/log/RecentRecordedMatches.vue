<template>
    <div>
        <template v-if="title.length > 0">
            <div class="d-flex text-h6 align-center">
                {{ title }}

                <v-btn icon @click="refreshData()">
                    <v-icon>
                        mdi-refresh
                    </v-icon>
                </v-btn>

                <v-spacer></v-spacer>

                <template v-if="enableSelect && $store.state.currentUser.id === userId">
                    <template v-if="!inSelectMode">
                        <v-btn
                            color="primary"
                            @click="startSelect"
                        >
                            Select
                        </v-btn>
                    </template>

                    <template v-else>
                        <v-dialog persistent v-model="showHideDelete" max-width="60%">
                            <template v-slot:activator="{on, attrs}">
                                <v-btn
                                    icon
                                    color="error"
                                    :disabled="selected.length === 0"
                                    v-on="on"
                                    v-bind="attrs"
                                >
                                    <v-icon>
                                        mdi-delete
                                    </v-icon>
                                </v-btn>
                            </template>

                            <v-card>
                                <v-card-title>
                                    Are you sure?
                                </v-card-title>

                                <v-card-text>
                                    Are you sure you want to delete {{ selected.length }} VODs?
                                    This action can not be undone.
                                </v-card-text>

                                <v-card-actions>
                                    <v-btn
                                        color="error"
                                        @click="showHideDelete = false"
                                    >
                                        Cancel
                                    </v-btn>

                                    <v-spacer></v-spacer>

                                    <v-btn
                                        color="success"
                                        @click="deleteSelectedVods"
                                        :loading="deleteInProgress"
                                    >
                                        Delete
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-dialog>

                        <v-btn
                            @click="toggleSelected"
                            outlined
                            class="ml-2"
                        >
                            <v-checkbox
                                :input-value="allSelected"
                                readonly
                            >
                            </v-checkbox>

                            {{ selected.length }} Selected
                        </v-btn>

                        <v-btn
                            class="ml-2"
                            icon
                            @click="closeSelect"
                            color="warning"
                        >
                            <v-icon>
                                mdi-close
                            </v-icon>
                        </v-btn>
                    </template>
                </template>
            </div>

            <v-divider class="my-2"></v-divider>
        </template>

        <div class="d-flex align-center full-width">
            <recent-match-filters-ui
                v-model="filters"
                :disable-squads="isUserLocked || squadId !== undefined"
                :disable-users="isUserLocked"
                :saved-filter-loc="DataStorageLocation.RecentMatch"
            >
            </recent-match-filters-ui>
        </div>
        
        <loading-container :is-loading="!recentMatches">
            <template v-slot:default="{ loading }">
                <template v-if="!loading && recentMatches.length > 0">
                    <template v-for="(group, gidx) in groupedMatches">
                        <div class="d-flex align-center my-2" :key="`group-header-${gidx}`">
                            <v-divider class="mr-4"></v-divider>

                            <div class="text-caption">
                                Played {{ group.days }}
                            </div>
                        </div>

                        <div class="full-width" :key="`group-matches-${gidx}`">
                            <div
                                class="pa-0 mb-1"
                                v-for="(match, idx) in group.matches"
                                :key="idx"
                            >
                                <div
                                    class="d-flex align-center"
                                    @click="toggleMatchSelectIfInMode(match.matchUuid)"
                                >
                                    <v-checkbox
                                        v-if="inSelectMode"
                                        :input-value="isMatchSelected(match.matchUuid)"
                                        @change="selectMatch(match.matchUuid, arguments[0])"
                                        @click.stop
                                    >
                                    </v-checkbox>

                                    <recent-match-display
                                        class="mb-4 full-width"
                                        :match="match"
                                        :pov="perMatchSelectedPov[match.matchUuid]"
                                        :use-local-vod-preview="perMatchSelectedPov[match.matchUuid].isLocal"
                                        :disable-mini="disableMini"
                                        :disable-click="inSelectMode"
                                    >
                                    </recent-match-display>
                                </div>

                                <div class="d-flex align-center justify-end">
                                    <template v-if="match.povs.length > 1">
                                        <div class="mr-1">
                                            POV:
                                        </div>

                                        <v-select
                                            class="mt-0 mr-2 flex-grow-0"
                                            :value="perMatchSelectedPov[match.matchUuid]"
                                            @input="$set(perMatchSelectedPov, match.matchUuid, arguments[0])"
                                            dense
                                            hide-details
                                            :items="povSelectionForMatch(match)"
                                        >
                                        </v-select>
                                    </template>

                                    <slot name="actions" v-bind:match="match" v-bind:pov="perMatchSelectedPov[match.matchUuid]">
                                    </slot>
                                </div>
                            </div>
                        </div>
                    </template>

                    <v-btn
                        v-if="hasNext"
                        color="primary"
                        block
                        :loading="dataLoading"
                        @click="loadMoreMatches()"
                    >
                        Load More
                    </v-btn>
                </template>

                <div class="d-flex justify-center align-center full-parent-height full-width long-text" v-else>
                    <div class="text-h6">
                        No recently recorded matches found for you or your squadmates! Start playing some games to get SquadOV to automatically record VODs. Don't forget to invite your friends! <b>SquadOV does not record games if was not running on your local machine for the full duration of the match.</b>
                    </div>
                </div>
            </template>
        </loading-container>

        <v-snackbar
            v-model="showHideDeleteError"
            :timeout="5000"
            color="error"
        >
            Failed to delete VODs. Please try again.
        </v-snackbar>
    </div>
</template>

<script lang="ts">

const maxTasksPerRequest : number = 10

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { RecentMatch, checkRecentMatchValidity, RecentMatchFilters, createEmptyRecentMatchFilters, RecentMatchPov } from '@client/js/squadov/recentMatch'
import { apiClient, HalResponse, ApiData } from '@client/js/api'
import { numDaysAgo, numDaysAgoToString } from '@client/js/time'
import { DataStorageLocation } from '@client/js/system/data_storage'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import RecentMatchDisplay from '@client/vue/utility/RecentMatchDisplay.vue'
import RecentMatchFiltersUi from '@client/vue/utility/RecentMatchFiltersUi.vue'

interface GroupedMatch {
    days: string
    matches: RecentMatch[]
}

@Component({
    components: {
        LoadingContainer,
        RecentMatchDisplay,
        RecentMatchFiltersUi,
    }
})
export default class RecentRecordedMatches extends Vue {
    DataStorageLocation = DataStorageLocation

    @Prop({default: 'Recent VODs'})
    title!: string

    @Prop()
    userId!: number | undefined

    @Prop()
    squadId!: number | undefined

    @Prop({type: Boolean, default: false})
    onlyFavorite!: boolean

    @Prop({type: Boolean, default: false})
    onlyWatchlist!: boolean

    @Prop({type: Boolean, default: false})
    disableMini!: boolean

    @Prop({type: Boolean, default: false})
    profile!: boolean

    @Prop()
    accessToken!: string | undefined

    @Prop({type: Boolean, default: false})
    enableSelect!: boolean

    recentMatches: RecentMatch[] | null = null
    perMatchSelectedPov: {[uuid: string]: RecentMatchPov} = {}

    lastIndex: number = 0
    nextLink: string | null = null
    filters: RecentMatchFilters = createEmptyRecentMatchFilters()
    queuedFilters: RecentMatchFilters | null = null
    dataLoading: boolean = false

    inSelectMode: boolean = false
    selected: string[] = []
    deleteInProgress: boolean = false
    showHideDelete: boolean = false
    showHideDeleteError: boolean = false

    get isUserLocked(): boolean {
        return this.userId !== undefined
    }

    get hasNext() : boolean {
        return !!this.nextLink
    }

    get filteredMatches() : RecentMatch[] {
        if (!this.recentMatches) {
            return []
        }

        return this.recentMatches.filter((ele: RecentMatch) => {
            return checkRecentMatchValidity(ele)
        }).filter((ele: RecentMatch) => {
            if (this.inSelectMode) {
                return ele.povs.some((ele: RecentMatchPov) => {
                    return ele.userId === this.$store.state.currentUser?.id
                })
            } else {
                return true
            }
        })
    }

    get groupedMatches(): GroupedMatch[] {
        let grouped: Map<number, RecentMatch[]> = new Map()
        this.filteredMatches.forEach((ele: RecentMatch) => {
            let avgTime = new Date(ele.povs.map((ele) => ele.tm.getTime()).reduce((a, b) => a + b, 0) / ele.povs.length)
            let days = numDaysAgo(avgTime)
            if (!grouped.has(days)) {
                grouped.set(days, [])
            }

            let arr = grouped.get(days)!
            arr.push(ele)
            grouped.set(days, arr)
        })

        let ret: GroupedMatch[] = []
        for (const [days, matches] of grouped) {
            ret.push({
                days: numDaysAgoToString(days),
                matches
            })
        }
        return ret
    }


    get finalFilters(): RecentMatchFilters {
        let filters: RecentMatchFilters = JSON.parse(JSON.stringify(this.filters))

        // We shouldn't use the users filter if we only want favorites/watch list otherwise
        // we won't get matches of other users that we favorited/watch listed.
        if (this.userId !== undefined && !this.onlyFavorite && !this.onlyWatchlist) {
            filters.users = [this.userId]
        }

        if (this.squadId !== undefined) {
            filters.squads = [this.squadId]
        }

        filters.onlyFavorite = this.onlyFavorite
        filters.onlyWatchlist = this.onlyWatchlist
        return filters
    }

    @Watch('finalFilters', { deep: true })
    refreshData(filters: RecentMatchFilters | undefined = undefined) {
        this.recentMatches = null
        this.nextLink = null
        this.lastIndex = 0

        if (!filters) {
            // In this case, we're looking to refresh refresh starting from game 0.
            // Which means we need to change the end date to be current so that we pull more recent games.
            this.filters.timeEnd = new Date().getTime()
        }

        // It takes a bit for the matches to load and loadMoreMatches will ignore requests
        // if something is already loading. What we want to do instead is to queue up requests
        // if something is already loading with the most recent filters.
        let filterToUse = !!filters ? filters : this.finalFilters
        if (this.dataLoading) {
            this.queuedFilters = JSON.parse(JSON.stringify(filterToUse))
        } else {
            this.loadMoreMatches(filterToUse)
        }
    }

    loadMoreMatches(filters: RecentMatchFilters | undefined = undefined) {
        if (this.dataLoading) {
            return
        }

        this.dataLoading = true
        apiClient.accessToken(this.accessToken).listMyRecentMatches({
            next: this.nextLink,
            start: this.lastIndex,
            end: this.lastIndex + maxTasksPerRequest,
            filters: !!filters ? filters : this.finalFilters,
            profileId: this.profile ? this.userId : undefined,
        }).then((resp : ApiData<HalResponse<RecentMatch[]>>) => {
            if (!this.recentMatches) {
                this.recentMatches = resp.data.data
            } else {
                this.recentMatches.push(...resp.data.data)
            }            
            
            this.refreshPovSelection()
            this.forcePovSelectionToSelfIfPossible(resp.data.data)

            this.lastIndex += resp.data.data.length
            if ("next" in resp.data._links) {
                this.nextLink = resp.data._links["next"].href
            } else {
                this.nextLink = null
            }
        }).catch((err : any) => {
            console.error('Failed to list recent SquadOV matches: ' + err);
        }).finally(() => {
            this.dataLoading = false
            if (!!this.queuedFilters) {
                this.refreshData(this.queuedFilters)
                this.queuedFilters = null
            }
        })
    }

    mounted() {
        this.refreshData()
    }

    get povSelectionForMatch(): (match: RecentMatch) => any[] {
        return (match: RecentMatch) => {
            return match.povs.map((ele: RecentMatchPov) => {
                return {
                    text: ele.username,
                    value: ele,
                }
            })
        }
    }

    refreshPovSelection() {
        if (!this.recentMatches) {
            return
        }

        for (let r of this.recentMatches) {
            if (r.matchUuid in this.perMatchSelectedPov) {
                continue
            }

            if (r.povs.length > 0) {
                Vue.set(this.perMatchSelectedPov, r.matchUuid, r.povs[0])
            }
        }
    }

    removeContent(videoUuid: string) {
        if (!this.recentMatches) {
            return
        }

        this.recentMatches.forEach(
            (ele: RecentMatch) => {
                ele.povs = ele.povs.filter((ele: RecentMatchPov) => ele.vod.videoTracks[0].metadata.videoUuid !== videoUuid)
            }
        )

        this.recentMatches = this.recentMatches.filter((ele: RecentMatch) => ele.povs.length > 0)
        for (let [uuid, pov] of Object.entries(this.perMatchSelectedPov)) {
            if (pov.vod.videoTracks[0].metadata.videoUuid === videoUuid) {
                Vue.delete(this.perMatchSelectedPov, uuid)
            }
        }
        this.refreshPovSelection()
    }

    get allSelected(): boolean {
        return this.recentMatches?.length === this.selected.length
    }

    toggleSelected() {
        if (this.allSelected) {
            this.selected = []
        } else if (!!this.recentMatches) {
            this.selected = this.recentMatches.map((ele: RecentMatch) => ele.povs[0].vod.videoTracks[0].metadata.videoUuid)
        } else {
            this.selected = []
        }
    }

    forcePovSelectionToSelfIfPossible(data: RecentMatch[]) {
        for (let d of data) {
            let pov = d.povs.find((ele: RecentMatchPov) => {
                return ele.userId === this.$store.state.currentUser?.id
            })

            if (!pov) {
                continue
            }

            Vue.set(this.perMatchSelectedPov, d.matchUuid, pov)
        }
    }

    startSelect() {
        this.inSelectMode = true

        if (!!this.recentMatches) {
            this.forcePovSelectionToSelfIfPossible(this.recentMatches)
        }
    }

    closeSelect() {
        this.inSelectMode = false
        this.selected = []
    }

    deleteSelectedVods() {
        if (this.selected.length === 0) {
            return
        }

        this.deleteInProgress = true
        apiClient.deleteVods(this.selected, false).then(() => {
            this.refreshData()
            this.showHideDelete = false
        }).catch((err: any) => {
            console.error('Failed to delete VODs: ', err)
            this.showHideDeleteError = true
        }).finally(() => {
            this.deleteInProgress = false
        })
    }

    get isMatchSelected(): (matchUuid: string) => boolean {
        return (matchUuid: string) => {
            let pov = this.perMatchSelectedPov[matchUuid]
            if (!pov) {
                return false
            }
            return this.selected.includes(pov.vod.videoTracks[0].metadata.videoUuid)
        }
    }

    selectMatch(matchUuid: string, val: boolean) {
        let pov = this.perMatchSelectedPov[matchUuid]
        if (!pov) {
            return
        }
        
        if (val) {
            this.selected.push(pov.vod.videoTracks[0].metadata.videoUuid)
        } else {
            let idx = this.selected.findIndex((ele: string) => ele === pov.vod.videoTracks[0].metadata.videoUuid)
            if (idx < 0) {
                return
            }

            this.selected.splice(idx, 1)
        }
    }

    toggleMatchSelectIfInMode(matchUuid: string) {
        if (!this.inSelectMode) {
            return
        }

        let selected = this.isMatchSelected(matchUuid)
        this.selectMatch(matchUuid, !selected)
    }
}

</script>