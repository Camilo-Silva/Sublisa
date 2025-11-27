import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { SideCartComponent } from './shared/components/side-cart/side-cart.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { WhatsappButton } from './shared/components/whatsapp-button/whatsapp-button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ToastContainerComponent, SideCartComponent, ModalComponent, WhatsappButton],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
