<template>
    <v-card>
        <v-card-title>
            User: {{ user.username }}
        </v-card-title>

        <v-divider></v-divider>

        <v-container fluid>
            <v-row>
                <v-col cols="2">
                    <b>ID</b>
                </v-col>

                <v-col cols="10">
                    {{ user.id }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Username</b>
                </v-col>

                <v-col cols="10">
                    {{ user.username }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Email</b>
                </v-col>

                <v-col cols="10">
                    {{ user.email }}

                    <span class="ml-2">
                        Email {{ user.verified ? 'Verified': 'Not Verified'}}
                    </span>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Registered</b>
                </v-col>

                <v-col cols="10">
                    {{ user.registrationTime }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Last Session</b>
                </v-col>

                <v-col cols="10">
                    {{ user.lastSession }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Last Active</b>
                </v-col>

                <v-col cols="10">
                    {{ user.lastActive }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Last VOD Time</b>
                </v-col>

                <v-col cols="10">
                    {{ user.lastVod }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Riot Accounts</b>
                </v-col>

                <v-col cols="10">
                    {{ user.accounts.linkedRiot.join(', ') }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Twitch Accounts</b>
                </v-col>

                <v-col cols="10">
                    {{ user.accounts.linkedTwitch.join(', ') }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>WoW Characters</b>
                </v-col>

                <v-col cols="10">
                    {{ user.accounts.wowChars.join(', ') }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Steam Accounts</b>
                </v-col>

                <v-col cols="10">
                    {{ user.accounts.steamAccounts.join(', ') }}
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="2">
                    <b>Hardware</b>
                </v-col>

                <v-col cols="10">
                    <template v-if="!!user.hw">
                        <v-list>
                            <v-list-item>
                                <v-list-item-content>
                                    <b>CPU</b>

                                    {{ user.hw.cpu }}
                                </v-list-item-content>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-content>
                                    <b>OS</b>

                                    {{ user.hw.os }}
                                </v-list-item-content>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-content>
                                    <b>RAM</b>

                                    {{ user.hw.ramKb }} Kb
                                </v-list-item-content>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-content>
                                    <b>GPU 0</b>

                                    {{ user.hw.gpu0 }}
                                </v-list-item-content>
                            </v-list-item>

                            <v-list-item>
                                <v-list-item-content>
                                    <b>GPU 1</b>

                                    {{ user.hw.gpu1 }}
                                </v-list-item-content>
                            </v-list-item>
                        </v-list>
                    </template>

                    <span v-else>
                        No hardware on file.
                    </span>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { User } from '@client/ts/user'

@Component
export default class UserDisplay extends Vue {
    @Prop({required: true})
    user!: User
}

</script>