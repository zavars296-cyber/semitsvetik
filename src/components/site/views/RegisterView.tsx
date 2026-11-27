'use client';

import { PageHero } from '../Section';
import { RegistrationForm } from '../RegistrationForm';

export function RegisterView() {
  return (
    <>
      <PageHero eyebrow="Запис" title="Запис на заняття" text="Заповніть коротку форму — адміністратор зв’яжеться з вами, відповість на запитання та запропонує зручний час." />
      <section className="container-x max-w-3xl py-4"><RegistrationForm /></section>
    </>
  );
}
