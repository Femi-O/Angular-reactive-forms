import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, AbstractControl, ValidatorFn } from '@angular/forms';
import { Validators, FormArray } from '@angular/forms';
import { Customer } from './customer';
import { debounceTime } from 'rxjs/operators';

function emailMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');

  if (emailControl.pristine || confirmControl.pristine) {
    return null;
  }

  if (emailControl.value === confirmControl.value) {
    return null;
  }
  return { 'match': true };
}

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl):{ [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min|| c.value > max)) {
      return {'range': true };
    }
    return null;
  }
}
@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  // DECLARATIONS SECTION B4 CONSTRUCTOR
  // create customerForm with type FormGroup. It's what's going to act as an input element in the html.
  customerForm: FormGroup;

  // Below is the data model. It defines what's passed to and from a backend server
  customer = new Customer();
  emailMessage: string;

  get addresses(): FormArray{
    return <FormArray>this.customerForm.get('addresses');
  }

private validationMessages = {
  required: 'Please enter your email address.',
  email: 'Please enter a valid email address.'
};

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', Validators.required],
      }, {validator: emailMatcher}),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1,5)],
      sendCatalog: true,
      addresses: this.fb.array([ this.buildAddress() ])

    });

    this.customerForm.get('notification').valueChanges.subscribe(
      value => this.setNotification(value)
    );

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.setMessage(emailControl)
    );
  }

  // THIS IS THE FORMER FORM CODE BEFORE FORM BUILDER WAS USED TO REBUILD IT WITH LESS CODE.
  // ngOnInit(): void {
  //   // Below is essentially the form
  //   this.customerForm = new FormGroup({
  //     // Here are the input elements. We explicitly define all going on under the hood since it's not pre-set by Angular or HTML or anything else.
  //     firstName: new FormControl(),
  //     lastName: new FormControl(),
  //     email: new FormControl(),
  //     // default values are set by passing them into the FormControl
  //     sendCatalogue: new FormControl(true),
  //   });
  // }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    })
  }

  populateTestData(): void{
    this.customerForm.setValue({
      firstName: 'uhn',
      lastName: 'ahnn',
      email: 'bulbasaur@yahoo.com',
      sendCatalogue: false,
    })
  }

  // log customer form value using this
  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }
}
