import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup; // utiliser ! pour éviter TS error
  currentStep = 1;
  isSubmitting = false;
  registrationSuccess = false;
  showPassword = false;
  showConfirmPassword = false;
  maxDate = new Date().toISOString().split('T')[0]; // limite date

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      securityQuestion: ['', Validators.required],
      securityAnswer: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
      acceptPrivacy: [false, Validators.requiredTrue]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.registerForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Ce champ est requis';
    if (control.errors['email']) return 'Email invalide';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
    if (control.errors['requiredTrue']) return 'Vous devez accepter cette case';
    return 'Champ invalide';
  }

  passwordsMatch(): boolean {
    return this.registerForm.get('password')?.value === this.registerForm.get('confirmPassword')?.value;
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility() { this.showConfirmPassword = !this.showConfirmPassword; }

  nextStep() { if (this.canProceedToNextStep()) this.currentStep++; }
  previousStep() { if (this.currentStep > 1) this.currentStep--; }

  canProceedToNextStep(): boolean {
    if (this.currentStep === 1) {
      const f = this.registerForm;
      return (f.get('firstName')?.valid ?? false )
        &&(f.get('lastName')?.valid ?? false )
          &&( f.get('email')?.valid ?? false )
            &&(f.get('phone')?.valid ?? false )
              &&( f.get('dateOfBirth')?.valid ?? false);
    }
    if (this.currentStep === 2) {
      const f = this.registerForm;
      return (f.get('password')?.valid ?? false) &&
        (f.get('confirmPassword')?.valid ?? false) &&
        (f.get('securityQuestion')?.valid ?? false) &&
        (f.get('securityAnswer')?.valid ?? false);
      this.passwordsMatch();
    }
    return true;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      // Ici tu peux appeler ton service pour créer l'utilisateur
      setTimeout(() => {
        this.registrationSuccess = true;
        this.isSubmitting = false;
        // Redirection après succès
        this.router.navigate(['/login']);
      }, 1500);
    }
  }
}
