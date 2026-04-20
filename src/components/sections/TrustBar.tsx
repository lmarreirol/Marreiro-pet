import Icon from '@/components/ui/Icon'

export default function TrustBar() {
  return (
    <div className="trust-bar">
      <div className="container trust-grid">
        <div className="trust-item"><Icon name="shield" size={22} /> Desde 2018</div>
        <div className="trust-item"><Icon name="users" size={22} /> Veterinários especialistas</div>
        <div className="trust-item"><Icon name="award" size={22} /> Equipamentos modernos</div>
        <div className="trust-item"><Icon name="clock" size={22} /> Atendimento todos os dias</div>
      </div>
    </div>
  )
}
