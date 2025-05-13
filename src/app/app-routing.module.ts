// // src/app/app-routing.module.ts
// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './login/login.component';
// import { DashboardComponent } from './dashboard/dashboard.component';
// import { CatalogsComponent } from './catalogs/catalogs.component';
// import { CatalogDetailComponent } from './catalog-detail/catalog-detail.component';
// import { AuthGuard } from './guards/auth.guard';

// const routes: Routes = [
//   { path: 'login', component: LoginComponent },
//   { 
//     path: 'dashboard', 
//     component: DashboardComponent,
//     canActivate: [AuthGuard]
//   },
//   { 
//     path: 'catalogs', 
//     component: CatalogsComponent,
//     canActivate: [AuthGuard]
//   },
//   { 
//     path: 'catalogs/:tapNumber', 
//     component: CatalogDetailComponent,
//     canActivate: [AuthGuard]
//   },
//   { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
//   { path: '**', redirectTo: '/dashboard' }
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule]
// })
// export class AppRoutingModule { }

// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CatalogsComponent } from './catalogs/catalogs.component';
import { CatalogDetailComponent } from './catalog-detail/catalog-detail.component';
import { CatalogCodesComponent } from './catalog-codes/catalog-codes.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { AuthGuard } from './guards/auth.guard';
import { SongwriterComponent } from './songwriter/songwriter.component';
import { TaggingSongComponent } from './tagging-song/tagging-song.component';
import { OriginalPublishingComponent } from './original-publishing/original-publishing.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardHomeComponent },
      { path: 'songwriters', component: SongwriterComponent },
      { path: 'taggingSong', component: TaggingSongComponent },
      { path: 'originalPublishing', component: OriginalPublishingComponent },
      { path: 'catalogs', component: CatalogsComponent },
      { path: 'catalog-codes', component: CatalogCodesComponent },
      { path: 'catalogs/:tapNumber', component: CatalogDetailComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }