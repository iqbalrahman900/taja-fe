// src/app/country-selection-modal/country-selection-modal.component.ts
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, Input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-country-selection-modal',
  templateUrl: './country-selection-modal.component.html',
  styleUrls: ['./country-selection-modal.component.scss']
})
export class CountrySelectionModalComponent implements OnInit {
  @ViewChild('content') modalContent!: ElementRef;
  @Output() countriesSelected = new EventEmitter<string[]>();
  @Input() preSelectedCountries: string[] = [];
  
  // Add modalRef to track the current modal instance
  private modalRef: NgbModalRef | null = null;
  
  allCountries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua And Barbuda', 'Argentina', 'Armenia', 
    'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 
    'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia And Herzegovina', 'Botswana', 'Brazil', 
    'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 
    'Cote D\'ivoire', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 
    'Dominican Republic', 'Democratic Republic of the Congo', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 
    'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'French Polynesia', 'Gabon', 
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 
    'Guinea-bissau', 'Guyana', 'Haiti', 'Holy See (vatican City State)', 'Honduras', 'Hong Kong', 'Hungary', 
    'Iceland', 'India', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 
    'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Lao People\'s Democratic Republic', 
    'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 
    'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 
    'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Caledonia', 
    'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman', 'Pakistan', 
    'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 
    'Puerto Rico', 'Qatar', 'Romania', 'Russian Federation', 'Rwanda', 'Saint Kitts And Nevis', 'Saint Lucia', 
    'Saint Vincent And The Grenadines', 'Samoa', 'San Marino', 'Sao Tome And Principe', 'Saudi Arabia', 'Senegal', 
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 
    'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 
    'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syrian Arab Republic', 'Taiwan', 'Tajikistan', 'Tanzania', 
    'Thailand', 'Timor-leste', 'Togo', 'Tonga', 'Trinidad And Tobago', 'Tunisia', 'Turkey', 
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 
    'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Viet Nam', 'Western Sahara', 'Yemen', 
    'Zambia', 'Zimbabwe'
  ];
  
  filteredCountries: string[] = [];
  selectedCountries: string[] = [];
  isSelected: {[key: string]: boolean} = {};
  searchTerm = '';
  
  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
    this.filteredCountries = [...this.allCountries];
    this.initializeSelected();
  }
  
  initializeSelected(): void {
    this.selectedCountries = [...this.preSelectedCountries];
    this.allCountries.forEach(country => {
      this.isSelected[country] = this.selectedCountries.includes(country);
    });
  }

  filterCountries(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredCountries = this.allCountries.filter(country => 
      country.toLowerCase().includes(term)
    );
  }

  onCountryChange(country: string): void {
    if (this.isSelected[country]) {
      this.selectedCountries.push(country);
    } else {
      const index = this.selectedCountries.indexOf(country);
      if (index > -1) {
        this.selectedCountries.splice(index, 1);
      }
    }
  }

  selectAll(): void {
    this.filteredCountries.forEach(country => {
      this.isSelected[country] = true;
      if (!this.selectedCountries.includes(country)) {
        this.selectedCountries.push(country);
      }
    });
  }

  clearAll(): void {
    this.filteredCountries.forEach(country => {
      this.isSelected[country] = false;
      const index = this.selectedCountries.indexOf(country);
      if (index > -1) {
        this.selectedCountries.splice(index, 1);
      }
    });
  }

  getCountryId(country: string): string {
    return country.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  trackByCountry(index: number, country: string): string {
    return country;
  }

  open(): void {
    // Reset selections when opening
    this.initializeSelected();
    
    // Open modal and store the reference
    this.modalRef = this.modalService.open(this.modalContent, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    
    // Handle modal close/dismiss without affecting the promise
    this.modalRef.result.then(
      (result) => {
        // Handle successful close if needed
      },
      (reason) => {
        // Handle dismiss if needed
      }
    );
  }

  confirm(): void {
    // Emit the selected countries
    this.countriesSelected.emit([...this.selectedCountries]);
    
    // Close only this modal using its reference
    if (this.modalRef) {
      this.modalRef.close('confirmed');
      this.modalRef = null;
    }
  }
  
  // Add a cancel method for the cancel button
  cancel(): void {
    if (this.modalRef) {
      this.modalRef.dismiss('cancelled');
      this.modalRef = null;
    }
  }
}