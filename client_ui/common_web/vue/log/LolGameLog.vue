<template>
    <v-container fluid id="lolGameLog">
        <lol-filter-ui
            v-model="filters"
            class="mb-2"
            :saved-filter-loc="DataStorageLocation.Lol"
        >
        </lol-filter-ui>

        <v-row>
            <v-col cols="12">
                <!-- 
                    Game log
                -->
                <loading-container :is-loading="!allMatches">
                    <template v-slot:default="{ loading }">
                        <div v-if="!loading">
                            <template v-if="allMatches.length > 0">
                                <lol-match-summary
                                    class="mb-2"
                                    v-for="(match, index) in allMatches"
                                    :key="index"
                                    :match="match"
                                    :user-id="userId"
                                >
                                </lol-match-summary>

                                <v-btn
                                    v-if="hasNext"
                                    color="primary"
                                    block
                                    @click="loadMoreMatches(puuid, puuid)"  
                                >
                                    Load More
                                </v-btn>
                            </template>

                            <div class="d-flex justify-center align-center text-h5" v-else>
                                <span>
                                No games found. Open League of Legends and play a game to start recording.
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
import { LolPlayerMatchSummary } from '@client/js/lol/matches'
import { LolMatchFilters, createEmptyLolMatchFilters } from '@client/js/lol/filters'
import LolFilterUi from '@client/vue/utility/lol/LolFilterUi.vue'
import LoadingContainer from '@client/vue/utility/LoadingContainer.vue'
import LolMatchSummary from '@client/vue/utility/lol/LolMatchSummary.vue'
import { DataStorageLocation } from '@client/js/system/data_storage'

const maxTasksPerRequest : number = 20

@Component({
    components: {
        LoadingContainer,
        LolMatchSummary,
        LolFilterUi,
    }
})
export default class LolGameLog extends Vue {
    DataStorageLocation = DataStorageLocation

    @Prop({required: true})
    userId!: number

    @Prop({required: true})
    puuid!: string | undefined

    allMatches : LolPlayerMatchSummary[] | null = null
    lastIndex: number = 0
    nextLink: string | null = null
    filters: LolMatchFilters = createEmptyLolMatchFilters()

    get hasNext() : boolean {
        return !!this.nextLink
    }

    @Watch('userId')
    @Watch('filters', {deep: true})
    refreshData() {
        this.allMatches = null
        this.nextLink = null
        this.lastIndex = 0
        this.loadMoreMatches(this.puuid, this.puuid)
    }

    @Watch('puuid')
    loadMoreMatches(newPuuid : string | null | undefined, oldPuuid : string | null | undefined) {
        if (!this.puuid) {
            return
        }

        if (newPuuid !== oldPuuid) {
            this.allMatches = null
            this.nextLink = null
            this.lastIndex = 0
        }

        if (!!this.allMatches && !this.nextLink) {
            return
        }

        apiClient.listLolMatchesForPlayer({
            next: this.nextLink,
            userId: this.userId,
            puuid: this.puuid,
            start: this.lastIndex,
            end: this.lastIndex + maxTasksPerRequest,
            filters: this.filters,
        }).then((resp : ApiData<HalResponse<LolPlayerMatchSummary[]>>) => {
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
            console.error('Failed to list LoL matches: ' + err);
        })
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

#lolGameLog {
    overflow-y: auto;
    overflow-x: hidden;
}

</style>