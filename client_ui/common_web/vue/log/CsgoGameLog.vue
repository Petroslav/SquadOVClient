<template>
    <v-container fluid id="csgoGameLog">
        <csgo-filter-ui
            v-model="filters"
            class="my-2"
            :saved-filter-loc="DataStorageLocation.Csgo"
        >
        </csgo-filter-ui>

        <v-row>
            <v-col cols="12">
                <!-- 
                    Game log
                -->
                <loading-container :is-loading="!allMatches">
                    <template v-slot:default="{ loading }">
                        <div v-if="!loading">
                            <template v-if="allMatches.length > 0">
                                <csgo-player-match-summary-display
                                    class="mb-2"
                                    v-for="(match, index) in allMatches"
                                    :key="index"
                                    :match="match"
                                    :user-id="userId"
                                >
                                </csgo-player-match-summary-display>

                                <v-btn
                                    v-if="hasNext"
                                    color="primary"
                                    block
                                    @click="loadMoreMatches"  
                                >
                                    Load More
                                </v-btn>
                            </template>

                            <div class="d-flex justify-center align-center text-h5" v-else>
                                <span>
                                No games found. Open CS:GO and play a game to start recording your matches.
                                </span>
                            </div>
                        </div>
                    </template>
                </loading-container>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { apiClient, HalResponse, ApiData } from '@client/js/api'
import { CsgoPlayerMatchSummary } from '@client/js/csgo/summary'
import { CsgoMatchFilters, createEmptyCsgoMatchFilters } from '@client/js/csgo/filters'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import CsgoPlayerMatchSummaryDisplay from '@client/vue/utility/csgo/CsgoPlayerMatchSummaryDisplay.vue'
import CsgoFilterUi from '@client/vue/utility/csgo/CsgoFilterUi.vue'
import { DataStorageLocation } from '@client/js/system/data_storage'

const maxTasksPerRequest : number = 20

@Component({
    components: {
        LoadingContainer,
        CsgoPlayerMatchSummaryDisplay,
        CsgoFilterUi,
    }
})
export default class CsgoGameLog extends Vue {
    DataStorageLocation = DataStorageLocation

    @Prop({required: true})
    userId!: number

    allMatches : CsgoPlayerMatchSummary[] | null = null
    lastIndex: number = 0
    nextLink: string | null = null
    filters: CsgoMatchFilters = createEmptyCsgoMatchFilters()

    get hasNext() : boolean {
        return !!this.nextLink
    }

    @Watch('userId')
    @Watch('filters', {deep: true})
    refreshData() {
        this.allMatches = null
        this.nextLink = null
        this.lastIndex = 0
        this.loadMoreMatches()
    }

    loadMoreMatches() {
        if (!!this.allMatches && !this.nextLink) {
            return
        }

        apiClient.listCsgoMatchesForPlayer({
            next: this.nextLink,
            userId: this.userId,
            start: this.lastIndex,
            end: this.lastIndex + maxTasksPerRequest,
            filters: this.filters,
        }).then((resp : ApiData<HalResponse<CsgoPlayerMatchSummary[]>>) => {
            if (!this.allMatches) {
                this.allMatches = resp.data.data
            } else {
                this.allMatches.push(...resp.data.data)
            }
            this.lastIndex += resp.data.data.length
            if ("next" in resp.data._links) {
                this.nextLink = resp.data._links["next"].href
            } else {
                this.nextLink = null
            }
        }).catch((err : any) => {
            console.error('Failed to list CSGO matches: ' + err);
        })
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

#csgoGameLog {
    overflow-y: auto;
    overflow-x: hidden;
}

</style>