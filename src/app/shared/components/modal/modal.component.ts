import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  constructor(public modalService: ModalService) {}

  onConfirm() {
    this.modalService.close(true);
  }

  onCancel() {
    this.modalService.close(false);
  }

  onOverlayClick() {
    // Solo cerrar si no es tipo confirm
    if (this.modalService.modalState().type !== 'confirm') {
      this.modalService.close(false);
    }
  }
}
