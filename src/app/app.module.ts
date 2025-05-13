// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CatalogsComponent } from './catalogs/catalogs.component';
import { CatalogDetailComponent } from './catalog-detail/catalog-detail.component';
import { AddCatalogModalComponent } from './add-catalog-modal/add-catalog-modal.component';
import { AddContributorModalComponent } from './add-contributor-modal/add-contributor-modal.component';
import { AddDistributionModalComponent } from './add-distribution-modal/add-distribution-modal.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CatalogCodesComponent } from './catalog-codes/catalog-codes.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { SongwriterComponent } from './songwriter/songwriter.component';
import { UpdateSongwriterComponent } from './modal/update-songwriter/update-songwriter.component';
import { OriginalPublishingComponent } from './original-publishing/original-publishing.component';
import { TaggingSongComponent } from './tagging-song/tagging-song.component';
import { AddOriginalPublishingComponent } from './modal/add-original-publishing/add-original-publishing.component';
import { UpdateOriginalPublishingComponent } from './modal/update-original-publishing/update-original-publishing.component';
import { UpdateTaggingSongComponent } from './modal/update-tagging-song/update-tagging-song.component';
import { UpdateCatalogModalComponent } from './modal/update-catalog-modal/update-catalog-modal.component';
import { UpdateContributorModalComponent } from './modal/update-contributor-modal/update-contributor-modal.component';
import { CountrySelectionModalComponent } from './modal/country-selection-modal/country-selection-modal.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    CatalogsComponent,
    CatalogDetailComponent,
    AddCatalogModalComponent,
    AddContributorModalComponent,
    AddDistributionModalComponent,
    CatalogCodesComponent,
    DashboardHomeComponent,
    SongwriterComponent,
    UpdateSongwriterComponent,
    OriginalPublishingComponent,
    TaggingSongComponent,
    AddOriginalPublishingComponent,
    UpdateOriginalPublishingComponent,
    UpdateTaggingSongComponent,
    UpdateCatalogModalComponent,
    UpdateContributorModalComponent,
    CountrySelectionModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }