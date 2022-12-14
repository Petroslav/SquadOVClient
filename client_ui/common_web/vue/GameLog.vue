<template>
    <v-container fluid class="full-parent-height">
        <div class="d-flex align-center">
            <v-menu offset-y :disabled="!hasSquadDropdown" :close-on-content-click="false" v-model="showHideSquadMenu">
                <template v-slot:activator="{on, attrs}">
                    <v-btn
                        text
                        v-bind="attrs"
                        v-on="on"
                    >
                        <span v-if="!isLoadingCurrentUser">
                            <span class="squad-text" v-if="!!logSquad">
                                {{ logSquad.squadName }}
                                &nbsp;/&nbsp;
                            </span>
                            <span class="username-text">{{ logUser.username }}</span>
                        </span>
                        <v-progress-circular size="16" indeterminate v-else>
                        </v-progress-circular>

                        <v-icon small v-if="hasSquadDropdown">
                            mdi-chevron-down
                        </v-icon>
                    </v-btn>
                </template>

                <div class="squad-div" dense v-if="!isLoadingAllSquads">
                    <v-text-field
                        class="ma-2"
                        v-model="filteredSquadName"
                        clearable
                        prepend-icon="mdi-magnify"
                        hide-details
                    >
                    </v-text-field>

                    <template v-for="sq in allFilteredSquads">
                        <v-menu offset-x :close-on-content-click="false" :key="`squad-${sq.id}`">
                            <template v-slot:activator="{on, attrs}">
                                <div
                                    :class="`d-flex justify-space-between align-center pa-2 ${(sq.id === squadId) ? 'selected-squad' : ''}`"
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <div class="d-flex flex-column">
                                        <div class="title-font">{{ sq.squadName }} </div>
                                    </div>

                                    <div>
                                        <v-icon small>
                                            mdi-chevron-right
                                        </v-icon>
                                    </div>
                                </div>
                            </template>

                            <div class="squad-div">
                                <v-text-field
                                    class="ma-2"
                                    v-model="filteredMemberName"
                                    clearable
                                    prepend-icon="mdi-magnify"
                                    hide-details
                                >
                                </v-text-field>

                                <v-list dense>
                                    <v-list-item
                                        v-for="player in filteredSquadMembers(sq.id)"
                                        :key="`member-${sq.id}-${player.userId}`"
                                        :class="`${(player.userId === userId) ? 'selected-user' : ''}`"
                                        :to="constructTo(sq, player)"
                                    >
                                        <v-list-item-title>
                                            {{ player.username }}
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </div>
                        </v-menu>

                        <v-divider :key="`div-${sq.id}`"></v-divider>
                    </template>
                </div>

                <div class="d-flex align-center justify-center loading-div" v-else>
                    <v-progress-circular size="64" indeterminate>
                    </v-progress-circular>
                </div>
            </v-menu>

            <v-divider vertical></v-divider>

            <template v-if="!isLoadingCurrentUser">
                <router-link :to="homePageTo">
                    <v-tooltip bottom :open-delay="1000">
                        <template v-slot:activator="{on, attrs}">
                            <div :class="`ml-2 pa-2 d-flex align-center justify-center home-game game-div ${isOnHome ? 'selected-game' : ''}`" v-on="on" v-bind="attrs">
                                <v-icon 
                                    large
                                >
                                    mdi-all-inclusive
                                </v-icon>
                            </div>
                        </template>

                        <span>All Games</span>
                    </v-tooltip>
                </router-link>

                <template v-for="(game, idx) in supportedGames">
                    <div
                        :class="`pa-2 game-div ${$route.path.startsWith(game.route.path) ? 'selected-game' : ''}`"
                        :key="`game-${idx}`"
                        v-if="!game.disabled"
                    >
                        <router-link :to="game.to">
                            <v-tooltip bottom :open-delay="1000">
                                <template v-slot:activator="{on, attrs}">
                                    <v-img
                                        width="32px"
                                        :src="$root.generateAssetUri(game.icon)"
                                        contain
                                        v-bind="attrs"
                                        v-on="on"
                                    >
                                    </v-img>
                                </template>

                                <span>{{game.name}}</span>
                            </v-tooltip>
                        </router-link>
                    </div>
                </template>
            </template>
            <v-spacer></v-spacer>
            <v-btn icon @click="refresh">
                <v-icon>
                    mdi-refresh
                </v-icon>
            </v-btn>
        </div>
        <v-divider></v-divider>

        <keep-alive :max="3">
            <router-view :key="routerKey"></router-view>
        </keep-alive>
    </v-container>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { Squad, SquadMembership } from '@client/js/squadov/squad'
import { SquadOVUser, getSquadOVUser } from '@client/js/squadov/user'
import { apiClient, ApiData } from '@client/js/api' 
import { routeLevelToKey } from '@client/js/routes'
import * as pi from '@client/js/pages'

@Component
export default class GameLog extends Vue {
    @Prop({required: true})
    userId!: number
    logUser: SquadOVUser | null = null

    @Prop({required: true})
    squadId!: number | undefined
    logSquad: Squad | null = null

    allSquads: Squad[] | null = null
    perSquadMembers: { [idx: number] : SquadMembership[] | undefined } | null = null

    showHideSquadMenu: boolean = false
    forceUpdateKey: number = 0

    // Squad and member filters so we can handle the case where we have a shit ton of
    // either squads or members (some of our squads have 1K members now...wtf)
    filteredSquadName: string = ''
    filteredMemberName: string = ''

    get routerKey(): string {
        let key = routeLevelToKey(this.$route, 2)
        return `${key}.${this.forceUpdateKey}`
    }

    get hasSquadDropdown(): boolean {
        return !!this.allSquads && this.allSquads.length > 0
    }

    get isLoadingCurrentUser(): boolean {
        return !this.logUser || (!this.logSquad && (this.squadId !== undefined && !isNaN(this.squadId)))
    }

    get currentPageName() : string | null | undefined {
        return this.$route.name
    }

    get isLoadingAllSquads(): boolean {
        if (!this.allSquads) {
            return true
        }

        if (!this.perSquadMembers) {
            return true
        }

        return this.allSquads.some((ele: Squad) => {
            return (this.perSquadMembers![ele.id] === undefined)
        })
    }

    get homePageTo(): any {
        return this.constructPageTo(pi.LogPageId)
    }

    get isOnHome(): boolean {
        return this.$route.name === pi.LogPageId
    }

    get supportedGames(): any[] {
        let aimlabTo = this.constructPageTo(pi.AimlabLogPageId)
        let csgoTo = this.constructPageTo(pi.CsgoLogPageId)
        let hearthstoneTo = this.constructPageTo(pi.HearthstoneLogPageId)
        let lolTo = this.constructPageTo(pi.LolLogPageId)
        let tftTo = this.constructPageTo(pi.TftLogPageId)
        let valorantTo = this.constructPageTo(pi.ValorantLogPageId)
        let wowTo = this.constructPageTo(pi.WowLogPageId)
        wowTo.params['release'] = 'retail'

        let wowVanillaTo = this.constructPageTo(pi.WowLogPageId)
        wowVanillaTo.params['release'] = 'vanilla'

        let wowTbcTo = this.constructPageTo(pi.WowLogPageId)
        wowTbcTo.params['release'] = 'tbc'

        return [
            {
                'icon': 'assets/aimlab-logo.png',
                'name': 'Aim Lab',
                'to': aimlabTo,
                'route': this.$router.resolve(aimlabTo).route
            },
            {
                'icon': 'assets/csgo-logo.png',
                'name': 'CS:GO',
                'to': csgoTo,
                'route': this.$router.resolve(csgoTo).route
            },
            {
                'icon': 'assets/hearthstone-logo.png',
                'name': 'Hearthstone',
                'to': hearthstoneTo,
                'route': this.$router.resolve(hearthstoneTo).route
            },
            {
                'icon': 'assets/lol-logo.png',
                'name': 'League of Legends',
                'to': lolTo,
                'route': this.$router.resolve(lolTo).route,
            },
            {
                'icon': 'assets/tft-logo.png',
                'name': 'Teamfight Tactics',
                'to': tftTo,
                'route': this.$router.resolve(tftTo).route,
            },
            {
                'icon': 'assets/valorant-logo.png',
                'name': 'Valorant',
                'to': valorantTo,
                'route': this.$router.resolve(valorantTo).route
            },
            {
                'icon': 'assets/wow-logo.png',
                'name': 'World of Warcraft',
                'to': wowTo,
                'route': this.$router.resolve(wowTo).route
            },
            {
                'icon': 'assets/tbc-logo.png',
                'name': 'Burning Crusade Classic',
                'to': wowTbcTo,
                'route': this.$router.resolve(wowTbcTo).route
            },
            {
                'icon': 'assets/wowc-logo.png',
                'name': 'World of Warcraft Classic',
                'to': wowVanillaTo,
                'route': this.$router.resolve(wowVanillaTo).route
            },
        ]
    }

    constructPageTo(page: string) : any {
        return {
            name: page,
            params: {
                userId: this.logUser?.id
            },
            query: {
                squadId: this.logSquad?.id
            }
        }
    }

    get constructTo() : (squad: Squad, user: SquadMembership) => any {
        return (squad: Squad, user: SquadMembership) : any => {
            return {
                name: this.currentPageName,
                params: {
                    userId: user.userId
                },
                query: {
                    squadId: squad.id
                }
            }
        }
    }

    refreshAllSquads() {
        // Note that this needs to be the *local users* squads not the current user's squads
        // because we only care about displaying the squads that we are in and the users within
        // those squads. Note the squads that our friends are in but not us!
        this.allSquads = null
        this.perSquadMembers = null
        apiClient.getUserSquads(this.$store.state.currentUser.id).then((resp: ApiData<SquadMembership[]>) => {
            this.allSquads = resp.data.map((ele: SquadMembership) => ele.squad)
            this.allSquads.sort((a: Squad, b: Squad) => {
                if (a.squadName < b.squadName) {
                    return -1
                } else if (a.squadName > b.squadName) {
                    return 1
                }
                return 0
            })

            this.perSquadMembers = {}
            for (let sq of this.allSquads) {
                let squadId = sq.id
                apiClient.getSquadUsers(squadId).then((resp: ApiData<SquadMembership[]>) => {
                    resp.data.sort((a: SquadMembership, b: SquadMembership) => {
                        if (a.username < b.username) {
                            return -1
                        } else if (a.username > b.username) {
                            return 1
                        }
                        return 0
                    })
                    Vue.set(this.perSquadMembers!, squadId, resp.data)
                }).catch((err: any) => {
                    console.error('Failed to obtain squad members: ', err)
                })
            }
        }).catch((err: any) => {
            console.error('Failed to obtain local user squads: ', err)
        })
    }

    get allFilteredSquads(): Squad[] {
        if (!this.allSquads) {
            return []
        }

        let filter = this.filteredSquadName.trim().toLowerCase()
        if (filter.length == 0) {
            return this.allSquads
        }

        return this.allSquads.filter((ele: Squad) => ele.squadName.toLowerCase().includes(filter))
    }

    get filteredSquadMembers(): (id: number) => SquadMembership[] {
        return (id: number) => {
            if (!this.perSquadMembers) {
                return []
            }

            let members = this.perSquadMembers[id]
            if (!members) {
                return []
            }

            let filter = this.filteredMemberName.trim().toLowerCase()
            if (filter.length == 0) {
                return members
            }

            return members.filter((ele: SquadMembership) => ele.username.toLowerCase().includes(filter))
        }
    }

    @Watch('userId')
    refreshUser() {
        // This is needed because sometimes we might change the selected user in which case
        // for some reason the Vuetify menu won't close the squad menu (it only closes the user menu).
        this.showHideSquadMenu = false

        this.logUser = null
        getSquadOVUser(this.userId).then((resp: ApiData<SquadOVUser>) => {
            this.logUser = resp.data
        }).catch((err: any) => {
            console.error('Failed to obtain user: ', err)
        })
    }

    @Watch('squadId')
    refreshSquad() {
        // This is needed just in case we select the same user in a different squad. Pepehands.
        this.showHideSquadMenu = false

        this.logSquad = null
        if (this.squadId === undefined || isNaN(this.squadId)) {
            return
        }

        apiClient.getSquad(this.squadId).then((resp: ApiData<Squad>) => {
            this.logSquad = resp.data
        }).catch((err: any) => {
            console.error('Failed to obtain squad: ', err)
        })
    }

    // The given userID and squadID must be ones that the current local user
    // has access to for this to work. 
    refreshData() {
        this.refreshUser()
        this.refreshSquad()
        this.refreshAllSquads()
    }

    refresh() {
        this.forceUpdateKey += 1
    }

    mounted() {
        this.refreshData()
    }
}

</script>

<style scoped>

.loading-div {
    width: 400px;
    height: 200px;
}

.title-font {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1rem;
}

.subtitle-font {
    color: rgba(255 ,255, 255, 0.7);
}

.squad-div {
    background-color: #1E1E1E;
    overflow-y: auto;
    max-height: 80vh;
}

.selected-squad {
    border-left: 5px solid #FFD700;
}

.selected-user {
    border-left: 5px solid #FFD700;
}

.game-div {
    border: 1px solid transparent;
}

.selected-game {
    border: 1px solid #FFD700 !important;
}

.squad-text {
    font-weight: 700;
    color: #FFD700;
}

.username-text {
    font-weight: 700;
    color: white;
}

.home-game {
    width: 50px;
    height: 50px;
}

</style>