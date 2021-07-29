import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AppService } from '../services/app.service';
import { LoadingController } from '@ionic/angular';
import { PluginListenerHandle } from '@capacitor/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public loginForm: FormGroup;
  private backEvent: PluginListenerHandle;
  public error: string;
  public errorMessage: string;

  constructor(
    public formBuilder: FormBuilder,
    private appService: AppService,
    private router: Router,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.formBuilder.group({
      username: new FormControl('', Validators.compose([
        Validators.required
      ])),
      password: new FormControl('', Validators.compose([
        Validators.required
      ]))
    });
  }

  async ngOnInit() {
    this.backEvent = await App.addListener('backButton', () => {
      App.exitApp();
    });
  }

  ionViewDidLeave() {
    this.backEvent.remove();
  }

  async ionViewDidEnter() {
    this.backEvent.remove();
    this.backEvent = await App.addListener('backButton', () => {
      App.exitApp();
    });
  }

  public async loginFromUser() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Chargement des données',
        spinner: 'dots'
      });
      await loading.present();

      this.error = null;
      this.errorMessage = null;

      await this.appService.login(
        this.loginForm.value.username,
        this.loginForm.value.password).then(() => {
        // Les identifiants sont bons, on passe à l'écran principal
        this.router.navigate(['/event-selection']);
      }).catch(er => {
        this.errorMessage = er.text;
        this.error = er.type;
      });

      this.loginForm.reset({
        username: this.loginForm.value.username
      });

      await loading.dismiss();
    }
  }
}
