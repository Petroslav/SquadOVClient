<template>
    <div class="d-flex flex-column align-center justify-center full-parent-height">
        <v-dialog
            :value="success !== null"
            persistent
            max-width="40%"
        >
            <v-card>
                <v-card-title>
                    {{ success ? 'Success' : 'Something went wrong!' }}
                </v-card-title>

                <v-card-text v-if="success">
                    You have successfully changed your password!
                    Redirecting you to the login page.
                </v-card-text>

                <v-card-text v-else>
                    Oops. Something went wrong, try again!
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        v-if="success"
                        color="success"
                        @click="redirect"
                    >
                        Redirect ({{ redirectSeconds }})
                    </v-btn>

                    <v-btn
                        v-if="!success"
                        color="success"
                        @click="success = null"
                    >
                        Ok
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <div id="formContainer">
            <div class="text-h3 mb-4">
                Choose a new password! Try not to forget it this time :)
            </div>

            <v-form
                v-model="formValid"
                class="mb-4"
            >
                <v-text-field
                    v-model="password"
                    label="Password"
                    solo
                    :rules="passwordRules"
                    type="password"
                >
                </v-text-field>

                <v-text-field
                    v-model="passwordConfirm"
                    label="Confirm Password"
                    solo
                    :rules="confirmRules"
                    type="password"
                >
                </v-text-field>
            </v-form>

            <v-btn
                color="success"
                :disabled="!formValid"
                :loading="inProgress"
                @click="reset(undefined)"
                block
            >
                Reset Password
            </v-btn>
        </div>

        <mfa-auth-dialog ref="mfa"></mfa-auth-dialog>
    </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { apiClient, ApiData, ChangePasswordOutput } from '@client/js/api'
import MfaAuthDialog from '@client/vue/utility/auth/MfaAuthDialog.vue'
import * as pi from '@client/js/pages'

@Component({
    components: {
        MfaAuthDialog
    }
})
export default class ForgotPassword extends Vue {
    @Prop({required: true})
    changePasswordId!: string

    @Prop({required: true})
    userId!: string

    formValid: boolean = false
    password: string = ''
    passwordConfirm: string = ''
    inProgress: boolean = false

    success: boolean | null = null
    redirectSeconds: number = 5
    itvl: number = 0

    $refs!: {
        mfa: MfaAuthDialog
    }

    get passwordRules() : any[] {
        return [
            (value : any) => !!value || 'Required.',
            (value : any) => (value || '').length >= 8 || 'Password must have at least 8 characters.',
            (value : any) => (value || '').length <= 20 || 'Password can have at most 20 characters.',
        ]
    }

    get confirmRules(): any[] {
        return [
            (value : any) => !!value || 'Required.',
            (value : any) => (this.password === value) || 'Password does not match.',
        ]
    }

    redirect() {
        this.$router.replace({
            name: pi.LoginPageId
        })
    }

    reset(mfaCode: string | undefined) {
        this.inProgress = true
        this.redirectSeconds = 5
        apiClient.changeForgottenPassword({
            changePasswordId: this.changePasswordId,
            password: this.password,
            userId: this.userId,
            mfaCode,
        }).then((resp: ApiData<ChangePasswordOutput>) => {
            if (!!resp.data.needsMfa) {
                this.$refs.mfa.open((code: string) => {
                    this.reset(code)
                })
            } else {
                this.success = true
                this.itvl = window.setInterval(() => {
                    this.redirectSeconds -= 1
                    if (this.redirectSeconds <= 0) {
                        this.redirect()
                    }
                }, 1000)
            }
        }).catch((err : any) => {
            this.success = false
        }).finally(() => {
            this.inProgress = false
        })
    }

    beforeDestroy() {
        if (!!this.itvl) {
            window.clearInterval(this.itvl)
        }
    }
}

</script>

<style scoped>

#formContainer {
    width: 60%;
}

</style>